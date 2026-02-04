const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "cloud-personal-security-bubble"
});

const db = admin.firestore();
db.settings({
  host: "127.0.0.1:8085",
  ssl: false
});

async function seed() {
  // ---------- SAFE ZONES ----------
  const safeZones = [
    {
      id: "aiims_hospital",
      data: {
        latitude: 28.5672,
        longitude: 77.21,
        radius: 600,
        activeFrom: 0,
        activeTo: 24,
        type: "hospital"
      }
    },
    {
      id: "metro_rajiv_chowk",
      data: {
        latitude: 28.6328,
        longitude: 77.2197,
        radius: 500,
        activeFrom: 5,
        activeTo: 23,
        type: "metro"
      }
    }
  ];

  // ---------- UNSAFE ZONES ----------
  const unsafeZones = [
    {
      id: "dark_underpass_noida",
      data: {
        latitude: 28.5421,
        longitude: 77.3719,
        radius: 500,
        severity: "high",
        type: "isolated_area"
      }
    },
    {
      id: "crime_hotspot_sector18",
      data: {
        latitude: 28.5701,
        longitude: 77.3260,
        radius: 700,
        severity: "medium",
        type: "crime_hotspot"
      }
    }
  ];

  for (const zone of safeZones) {
    await db.collection("safe_zones").doc(zone.id).set(zone.data);
  }

  for (const zone of unsafeZones) {
    await db.collection("unsafe_zones").doc(zone.id).set(zone.data);
  }

  console.log("✅ SAFE & UNSAFE zones seeded");
  process.exit();
}

seed();
