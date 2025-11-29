const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

exports.stravaWebhook = functions.https.onRequest(async (req, res) => {
  // 1. VERIFICATION
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
  
  if (event.object_type === 'activity' && event.aspect_type === 'create') {
    const stravaId = event.owner_id.toString();
    const activityId = event.object_id;

    try {
      // A. Find User
      const mapDoc = await db.collection('strava_mappings').doc(stravaId).get();
      if (!mapDoc.exists) return res.sendStatus(200);
      
      const { firebaseUid, appId } = mapDoc.data();
      const userRef = db.doc(`artifacts/${appId}/users/${firebaseUid}/game_data/main_save`);
      
      const userSnap = await userRef.get();
      const userData = userSnap.data();

      // B. Get Run Details
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
          let runType = 'survival'; // Default type
          let runNotes = activity.name;

          // --- SMART OVERFLOW LOGIC ---
          if (activeQuest && activeQuest.status === 'active') {
              const remainingNeeded = activeQuest.distance - activeQuest.progress;

              if (runKm >= remainingNeeded) {
                  // SCENARIO 1: OVERFLOW (Run is bigger than Quest needs)
                  // 1. Calculate the split
                  const questContribution = remainingNeeded;
                  const safetyContribution = runKm - remainingNeeded;

                  // 2. Complete the Quest
                  activeQuest.progress = activeQuest.distance;
                  activeQuest.status = 'completed';
                  
                  // 3. Add Reward
                  if (inventory[activeQuest.rewardPart] !== undefined) {
                      inventory[activeQuest.rewardPart]++;
                  }
                  badges.push({ 
                      id: Date.now(), 
                      title: activeQuest.title, 
                      date: new Date().toISOString() 
                  });

                  // 4. Update Safety with the LEFTOVER distance
                  newTotalKm += safetyContribution;
                  
                  runType = 'quest_complete';
                  runNotes = `${activity.name} (Quest Complete + ${safetyContribution.toFixed(2)}km Safety)`;

              } else {
                  // SCENARIO 2: SACRIFICE (Run is smaller than Quest needs)
                  // 1. Add ALL distance to Quest
                  activeQuest.progress += runKm;
                  
                  // 2. Add ZERO distance to Safety (The Entity catches up!)
                  // newTotalKm stays the same
                  
                  runType = 'quest_partial';
                  runNotes = `${activity.name} (Dedicated to Quest)`;
              }
          } else {
              // SCENARIO 3: NO QUEST (Normal Gameplay)
              newTotalKm += runKm;
          }
          // -----------------------------

          // Save to Database
          const newRun = {
              id: Date.now(),
              date: new Date().toISOString(),
              km: runKm,
              notes: runNotes,
              type: runType,
              source: 'strava'
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
      console.error('Webhook Error:', error);
    }
  }

  // 3. DEAUTHORIZE HANDLING
  if (event.aspect_type === 'update' && event.updates.authorized === 'false') {
      const stravaId = event.owner_id.toString();
      await db.collection('strava_mappings').doc(stravaId).delete();
  }

  res.sendStatus(200);
});