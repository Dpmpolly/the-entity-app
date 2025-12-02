const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();
const db = admin.firestore();

// Secrets
const stravaClientId = defineSecret('STRAVA_CLIENT_ID');
const stravaClientSecret = defineSecret('STRAVA_CLIENT_SECRET');
const stravaVerifyToken = defineSecret('STRAVA_VERIFY_TOKEN');

// GEN 2 SERVER SETUP (Native for Node 20)
exports.stravaWebhook = onRequest(
  { 
      secrets: [stravaClientId, stravaClientSecret, stravaVerifyToken],
      timeoutSeconds: 60,
      region: "us-central1",
      cors: true
  },
  async (req, res) => {

  // 1. VERIFICATION (SECURE VERSION)
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    // SECURE: We check against the Vault value, not a hardcoded string
    if (mode === 'subscribe' && token === stravaVerifyToken.value()) {
      res.json({ "hub.challenge": challenge });
      return;
    }
    res.sendStatus(403);
    return;
  }

  // 2. EVENT HANDLING
  const event = req.body;
  
  if (event.object_type === 'activity' && event.aspect_type === 'create') {
    const stravaId = event.owner_id.toString();
    const activityId = event.object_id;

    try {
      const mapDoc = await db.collection('strava_mappings').doc(stravaId).get();
      if (!mapDoc.exists) {
          console.log(`User not found: ${stravaId}`);
          res.sendStatus(200);
          return;
      }
      
      const { firebaseUid, appId } = mapDoc.data();
      const userRef = db.doc(`artifacts/${appId}/users/${firebaseUid}/game_data/main_save`);
      const userSnap = await userRef.get();
      const userData = userSnap.data();

      // Idempotency
      if (userData.runHistory?.some(r => r.stravaId === activityId)) {
          res.sendStatus(200);
          return;
      }

      // Refresh Token
      let accessToken = userData.stravaAccessToken;
      const now = Math.floor(Date.now() / 1000);

      if (userData.stravaExpiresAt && now >= (userData.stravaExpiresAt - 300)) {
          console.log("Refreshing token...");
          const refreshUrl = `https://www.strava.com/oauth/token?client_id=${stravaClientId.value()}&client_secret=${stravaClientSecret.value()}&grant_type=refresh_token&refresh_token=${userData.stravaRefreshToken}`;
          const refreshRes = await fetch(refreshUrl, { method: 'POST' });
          const refreshData = await refreshRes.json();

          if (refreshData.access_token) {
              accessToken = refreshData.access_token;
              await userRef.update({
                  stravaAccessToken: refreshData.access_token,
                  stravaRefreshToken: refreshData.refresh_token,
                  stravaExpiresAt: refreshData.expires_at
              });
          } else {
              res.sendStatus(200);
              return;
          }
      }

      // Fetch Activity
      const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
         headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const activity = await response.json();

      if (activity.type === 'Run') {
          const runKm = parseFloat((activity.distance / 1000).toFixed(2));
          let newTotalKm = userData.totalKmRun || 0;
          let activeQuest = userData.activeQuest || null;
          let inventory = userData.inventory || { battery: 0, emitter: 0, casing: 0 };
          let badges = userData.badges || [];
          let runType = 'survival';
          let runNotes = activity.name;

          if (activeQuest && activeQuest.status === 'active') {
              const remainingNeeded = activeQuest.distance - activeQuest.progress;
              if (runKm >= remainingNeeded) {
                  const safetyContribution = runKm - remainingNeeded;
                  activeQuest.progress = activeQuest.distance;
                  activeQuest.status = 'completed';
                  if (inventory[activeQuest.rewardPart] !== undefined) inventory[activeQuest.rewardPart]++;
                  badges.push({ id: Date.now(), title: activeQuest.title, date: new Date().toISOString() });
                  newTotalKm += safetyContribution;
                  runType = 'quest_complete';
                  runNotes = `${activity.name} (Quest Complete)`;
              } else {
                  activeQuest.progress += runKm;
                  runType = 'quest_partial';
                  runNotes = `${activity.name} (Quest Contribution)`;
              }
          } else {
              newTotalKm += runKm;
          }

          const newRun = {
              id: Date.now(),
              date: new Date().toISOString(),
              km: runKm,
              notes: runNotes,
              type: runType,
              source: 'strava',
              stravaId: activityId
          };
          
          await userRef.update({
              totalKmRun: newTotalKm,
              activeQuest: activeQuest,
              inventory: inventory,
              badges: badges,
              runHistory: [newRun, ...userData.runHistory]
          });
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Deauthorize
  if (event.aspect_type === 'update' && event.updates.authorized === 'false') {
      const stravaId = event.owner_id.toString();
      await db.collection('strava_mappings').doc(stravaId).delete();
  }

  res.sendStatus(200);
});