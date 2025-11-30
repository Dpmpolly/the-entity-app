const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

exports.stravaWebhook = functions.https.onRequest(async (req, res) => {
  // 1. VERIFICATION (Strava Handshake)
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === 'MY_SECRET_VERIFY_TOKEN') {
      res.json({ "hub.challenge": challenge });
      return;
    }
    res.sendStatus(403);
    return;
  }

  // 2. EVENT HANDLING
  const event = req.body;
  
  // We only care about NEW activities
  if (event.object_type === 'activity' && event.aspect_type === 'create') {
    const stravaId = event.owner_id.toString();
    const activityId = event.object_id; // Unique ID from Strava

    try {
      // A. Find the Firebase User
      const mapDoc = await db.collection('strava_mappings').doc(stravaId).get();
      if (!mapDoc.exists) {
          console.log(`No user found for Strava ID: ${stravaId}`);
          return res.sendStatus(200);
      }
      
      const { firebaseUid, appId } = mapDoc.data();
      const userRef = db.doc(`artifacts/${appId}/users/${firebaseUid}/game_data/main_save`);
      
      const userSnap = await userRef.get();
      const userData = userSnap.data();

      // --- B. IDEMPOTENCY CHECK (The Fix) ---
      // Check if we have already saved a run with this exact Strava ID
      const alreadyProcessed = userData.runHistory?.some(run => run.stravaId === activityId);
      
      if (alreadyProcessed) {
          console.log(`Duplicate event detected for Activity ${activityId}. Ignoring.`);
          return res.sendStatus(200); // Stop here. Do not add it again.
      }
      // -----------------------------------

      // C. Get Run Details from Strava
      const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
         headers: { 'Authorization': `Bearer ${userData.stravaAccessToken}` }
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

          // D. Smart Quest Logic
          if (activeQuest && activeQuest.status === 'active') {
              const remainingNeeded = activeQuest.distance - activeQuest.progress;

              if (runKm >= remainingNeeded) {
                  // Overflow: Complete Quest + Add leftovers to Safety
                  const safetyContribution = runKm - remainingNeeded;

                  activeQuest.progress = activeQuest.distance;
                  activeQuest.status = 'completed';
                  
                  if (inventory[activeQuest.rewardPart] !== undefined) {
                      inventory[activeQuest.rewardPart]++;
                  }
                  badges.push({ 
                      id: Date.now(), 
                      title: activeQuest.title, 
                      date: new Date().toISOString() 
                  });

                  newTotalKm += safetyContribution;
                  runType = 'quest_complete';
                  runNotes = `${activity.name} (Quest Complete + ${safetyContribution.toFixed(2)}km Safety)`;

              } else {
                  // Sacrifice: All distance goes to Quest
                  activeQuest.progress += runKm;
                  runType = 'quest_partial';
                  runNotes = `${activity.name} (Dedicated to Quest)`;
              }
          } else {
              // Normal Survival Run
              newTotalKm += runKm;
          }

          // E. Save to Database (Including the stravaId tag)
          const newRun = {
              id: Date.now(),
              date: new Date().toISOString(),
              km: runKm,
              notes: runNotes,
              type: runType,
              source: 'strava',
              stravaId: activityId // <--- This tag prevents future duplicates
          };
          
          await userRef.update({
              totalKmRun: newTotalKm,
              activeQuest: activeQuest,
              inventory: inventory,
              badges: badges,
              runHistory: [newRun, ...userData.runHistory]
          });
          
          console.log(`Processed run for ${firebaseUid}: ${runKm}km`);
      }

    } catch (error) {
      console.error('Webhook Error:', error);
    }
  }

  // 3. DEAUTHORIZE HANDLING (Compliance)
  if (event.aspect_type === 'update' && event.updates.authorized === 'false') {
      const stravaId = event.owner_id.toString();
      await db.collection('strava_mappings').doc(stravaId).delete();
      console.log(`User ${stravaId} revoked access.`);
  }

  res.sendStatus(200);
});