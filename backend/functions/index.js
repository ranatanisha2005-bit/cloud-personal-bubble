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
const { FieldValue } = require("firebase-admin/firestore");

admin.initializeApp();
const db = admin.firestore();

// ------------------ GEO UTILITY ------------------
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ------------------ MAIN FUNCTION ------------------
exports.updateLocation = onRequest(async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (!userId || isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const safeSnapshot = await db.collection("safe_zones").get();
    const unsafeSnapshot = await db.collection("unsafe_zones").get();

    let safetyStatus = "UNSAFE";

    let nearestSafeZone = null;
    let minSafeDistance = null;

    let isInUnsafeZone = false;
    let unsafeZoneType = null;
    let unsafeSeverity = null;

    const currentHour = new Date().getHours();

    // ---------- 1️⃣ CHECK UNSAFE ZONES (TOP PRIORITY) ----------
    unsafeSnapshot.forEach((doc) => {
      const zone = doc.data();

      const distance = getDistanceInMeters(
        lat,
        lon,
        zone.latitude,
        zone.longitude
      );

      if (distance <= zone.radius) {
        isInUnsafeZone = true;
        unsafeZoneType = zone.type;
        unsafeSeverity = zone.severity;
      }
    });

    // If inside unsafe → stop further checks
    if (isInUnsafeZone) {
      safetyStatus = "UNSAFE";
    } else {
      // ---------- 2️⃣ CHECK SAFE ZONES ----------
      safeSnapshot.forEach((doc) => {
        const zone = doc.data();

        const distance = getDistanceInMeters(
          lat,
          lon,
          zone.latitude,
          zone.longitude
        );

        if (minSafeDistance === null || distance < minSafeDistance) {
          minSafeDistance = distance;
          nearestSafeZone = zone;
        }

        // ⛑ ACTIVE HOURS ARE OPTIONAL
        const isActive =
          zone.activeFrom === undefined ||
          zone.activeTo === undefined ||
          (currentHour >= zone.activeFrom &&
            currentHour <= zone.activeTo);

        if (distance <= zone.radius && isActive) {
          safetyStatus = "SAFE";
        }
      });

      // ---------- 3️⃣ CAUTION ----------
      if (
        safetyStatus !== "SAFE" &&
        minSafeDistance !== null &&
        minSafeDistance <= 800
      ) {
        safetyStatus = "CAUTION";
      }
    }

    // ---------- WRITE LOCATION ----------
    await db.collection("locations").doc(userId).set({
      latitude: lat,
      longitude: lon,
      safetyStatus,
      nearestSafeZoneType: nearestSafeZone?.type || null,
      distanceFromNearestSafeZone: minSafeDistance,
      unsafeZoneType,
      unsafeSeverity,
      timestamp: FieldValue.serverTimestamp(),
    });

    // ---------- RESPONSE ----------
    res.json({
      safetyStatus,
      nearestSafeZoneType: nearestSafeZone?.type || null,
      distanceFromNearestSafeZone: minSafeDistance,
      unsafeZoneType,
      unsafeSeverity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
