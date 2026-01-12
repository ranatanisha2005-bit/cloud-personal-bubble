// /**
//  * Import function triggers from their respective submodules:
//  *
//  * const {onCall} = require("firebase-functions/v2/https");
//  * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
//  *
//  * See a full list of supported triggers at https://firebase.google.com/docs/functions
//  */

// const {setGlobalOptions} = require("firebase-functions");
// const {onRequest} = require("firebase-functions/https");
// const logger = require("firebase-functions/logger");

// //  For cost control, you can set the maximum number of containers that can be
// //  running at the same time. This helps mitigate the impact of unexpected
// // traffic spikes by instead downgrading performance. This limit is a
// // per-function limit. You can override the limit for each function using the
// // `maxInstances` option in the function's options, e.g.
// // `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// // NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// // functions should each use functions.runWith({ maxInstances: 10 }) instead.
// // In the v1 API, each function can only serve one request per container, so
// // this will be the maximum concurrent request count.
// setGlobalOptions({maxInstances: 10});

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((req, res) => {
//   logger.info("Hello from Cloud Functions!", {structuredData: true});
//   res.send("Backend is live ");
// });


//replaced code from chatgpt
// const { onRequest } = require("firebase-functions/https");
// const logger = require("firebase-functions/logger");
// const admin = require("firebase-admin");

// admin.initializeApp();

// const db = admin.firestore();

/**
 * API to save user location
 * URL: /updateLocation
 */
// exports.updateLocation = onRequest(async (req, res) => {
//   try {
//     const { userId, latitude, longitude } = req.body;

//     if (!userId || !latitude || !longitude) {
//       return res.status(400).send("Missing required fields");
//     }

//     await db.collection("locations").doc(userId).set({
//       latitude,
//       longitude,
//       timestamp: new Date()
//     });

//     logger.info("Location saved", { userId, latitude, longitude });

//     res.status(200).send("Location updated successfully");
//   } catch (error) {
//     logger.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });
const { onRequest } = require("firebase-functions/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const SAFE_LOCATION = {
  latitude: 28.6139,
  longitude: 77.2090
};

const SAFE_RADIUS_METERS = 500;
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


// Update user location
exports.updateLocation = onRequest(async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing data" });
    }

    const distance = getDistanceInMeters(
      latitude,
      longitude,
      SAFE_LOCATION.latitude,
      SAFE_LOCATION.longitude
    );

    const safetyStatus = distance <= SAFE_RADIUS_METERS ? "SAFE" : "UNSAFE";

    await db.collection("locations").doc(userId).set({
      latitude,
      longitude,
      distance,
      safetyStatus,
      timestamp: new Date(),
    });

    res.status(200).json({
      message: "Location updated successfully",
      safetyStatus,
      distance,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
