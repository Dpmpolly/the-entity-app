const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch'); // This is the tool we just installed

admin.initializeApp();
const db = admin.firestore();

// --- 1. THE WEBHOOK LISTENER ---
// This is the "Mailbox" Strava will send messages to
exports.stravaWebhook = functions.https.onRequest(async (req, res) => {
  
  // A. VERIFICATION (Strava sends a test message to see if we are real)
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === 'MY_SECRET_VERIFY_TOKEN') {
      console.log('WEBHOOK_VERIFIED');
      res.json({ "hub.challenge": challenge });
      return;
    } else {
      res.sendStatus(403);
      return;
    }
  }

  // B. SOMEONE WENT FOR A RUN (Event Handling)
  const event = req.body;
  
  // We only care if it's a NEW activity (create)
  if (event.object_type === 'activity' && event.aspect_type === 'create') {
    const stravaId = event.owner_id.toString();
    const activityId = event.object_id;

    console.log(`New run detected from Strava User: ${stravaId}`);

    try {
      // 1. Find which Firebase user this is
      const mapDoc = await db.collection('strava_mappings').doc(stravaId).get();
      if (!mapDoc.exists) {
        console.log('User not found in mapping.');
        res.sendStatus(200);
        return;
      }
      
      const { firebaseUid, appId } = mapDoc.data();
      const userRef = db.doc(`artifacts/${appId}/users/${firebaseUid}/game_data/main_save`);
      
      // 2. Fetch the user's data to get their saved access token
      const userSnap = await userRef.get();
      const userData = userSnap.data();

      // 3. Ask Strava for the details of this specific run
      const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
         headers: { 'Authorization': `Bearer ${userData.stravaAccessToken}` }
      });
      const activityData = await response.json();

      // 4. If it's a run, add it to the game!
      if (activityData.type === 'Run') {
          const km = parseFloat((activityData.distance / 1000).toFixed(2));
          
          const newTotal = (userData.totalKmRun || 0) + km;
          const newRun = {
              id: Date.now(),
              date: new Date().toISOString(),
              km: km,
              notes: activityData.name || 'Strava Run',
              source: 'strava_webhook'
          };
          
          await userRef.update({
              totalKmRun: newTotal,
              runHistory: [newRun, ...userData.runHistory]
          });
          console.log(`Updated user ${firebaseUid} with ${km}km`);
      }

    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  // C. DEAUTHORIZATION (User disconnected via Strava website)
  if (event.aspect_type === 'update' && event.updates.authorized === 'false') {
      const stravaId = event.owner_id.toString();
      await db.collection('strava_mappings').doc(stravaId).delete();
      console.log(`User ${stravaId} revoked access.`);
  }

  res.sendStatus(200);
});