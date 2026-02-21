import { useState, useEffect } from "react";
import "./Dashboard.css";
import { db } from "./firebase";
import { doc, setDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";

export default function Dashboard({ user, onLogout }) {
  const ZONE_RADIUS = 0.01;
  const SOS_THRESHOLD = 5;

  const [page, setPage] = useState("dashboard");
  const [bubbleActive, setBubbleActive] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [sosTime, setSosTime] = useState(0);
  const [fakeCallActive, setFakeCallActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contacts, setContacts] = useState([]);
  const [sosHistory, setSosHistory] = useState([]);
  const [alertShown, setAlertShown] = useState(false);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    let t;
    if (sosActive) t = setInterval(() => setSosTime(v => v + 1), 1000);
    return () => clearInterval(t);
  }, [sosActive]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ---------------- LOAD SOS HISTORY ---------------- */
  useEffect(() => {
    if (page === "history") loadSOSHistory();
  }, [page]);

  const loadSOSHistory = async () => {
    const snap = await getDocs(collection(db, "sosEvents"));
    const list = snap.docs.map(d => d.data()).filter(e => e.uid === user.uid).reverse();
    setSosHistory(list);
  };

  useEffect(() => {
  if (!bubbleActive) {
    setLocation(null);
    setAlertShown(false);
  }
}, [bubbleActive]);


  /* ---------------- LIVE LOCATION TRACKING ---------------- */
useEffect(() => {
  if (page !== "dashboard" || !bubbleActive) return;


  const watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      console.log("LIVE LOCATION:", lat,lng);

      setLocation({ lat, lng });
      setLocationError("");

      await checkDangerZone(lat, lng);
    },
    (err) => {
      console.log("Location error:", err.message);
      setLocationError("Live tracking disabled");
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, [page]);

  /* ---------------- LOCATION ---------------- */
  const getLiveLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        setLocationError("");
        await checkDangerZone(lat, lng);
      },
      () => setLocationError("Location permission denied")
    );
  };

  const checkDangerZone = async (lat, lng) => {
  const snap = await getDocs(collection(db, "dangerZones"));
  console.log("🔥 DANGER ZONES FOUND:", snap.size);

  let insideZone = false;

  snap.forEach(doc => {
    const zone = doc.data();

    const latDiff = Math.abs(zone.centerLat - lat);
    const lngDiff = Math.abs(zone.centerLng - lng);

    console.log("Checking zone:", zone.centerLat, zone.centerLng);

    if (latDiff < zone.radius && lngDiff < zone.radius) {
      insideZone = true;
      console.log("⚠️ INSIDE UNSAFE ZONE");

      if (!alertShown) {
        setAlertShown(true);
        showSafetyCheck(lat, lng);
      }
    }
  });


  // Reset alert when user leaves unsafe zone
  if (!insideZone) {
    setAlertShown(false);
  }
};

  const showSafetyCheck = (lat, lng) => {
  let responded = false;

  // Start 10-second auto SOS timer
  const timer = setTimeout(() => {
    if (!responded) {
      autoTriggerSOS(lat, lng);
    }
  }, 10000);

  const confirmSafe = window.confirm(
    "⚠️ Unsafe area detected.\nPress OK if you are SAFE.\nIf no response in 10 seconds, SOS will be sent."
  );

  responded = true; // user responded, stop auto trigger
  clearTimeout(timer);

  if (!confirmSafe) {
    autoTriggerSOS(lat, lng);
  }
};


  const stopSOS = () => {
    setSosActive(false);
    setSosTime(0);
  };

  /* ---------------- NOTIFY EMERGENCY CONTACTS ---------------- */
const notifyEmergencyContacts = async (lat, lng) => {
  const snap = await getDocs(collection(db, "users", user.uid, "contacts"));

  if (snap.empty) {
    alert("No emergency contacts saved");
    return;
  }

  const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
  const message = `🚨 EMERGENCY SOS ALERT 🚨\nUser needs help!\nLocation:\n${mapLink}`;

  snap.forEach(doc => {
    const contact = doc.data();
    window.open(`https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`, "_blank");
  });
};


  /* ---------------- AUTO SOS ---------------- */
  const autoTriggerSOS = async (lat, lng) => {
    if (sosActive) return;
    setSosActive(true);

    await setDoc(doc(db, "sosEvents", Date.now().toString()), {
      uid: user.uid,
      latitude: lat,
      longitude: lng,
      triggerType: "AUTO_UNSAFE_ZONE",
      timestamp: serverTimestamp()
    });

    await updateDangerZone(lat, lng);
    await notifyEmergencyContacts(lat, lng);

    alert("🚨 AUTO SOS TRIGGERED — Unsafe Area!");
  };

  /* ---------------- SOS ---------------- */
  const triggerSOS = async () => {
    if (!location) return alert("Get live location first");

    const { lat, lng } = location;
    setSosActive(true);

    await setDoc(doc(db, "sosEvents", Date.now().toString()), {
      uid: user.uid,
      latitude: lat,
      longitude: lng,
      triggerType: "MANUAL",
      timestamp: serverTimestamp()
    });

    await updateDangerZone(lat, lng);
    await notifyEmergencyContacts(lat, lng);

    alert("🚨 SOS SENT!");
  };

  /* ---------------- DANGER ZONE LOGIC ---------------- */
  const updateDangerZone = async (lat, lng) => {
    const snap = await getDocs(collection(db, "sosEvents"));
    let nearbyCount = 0;

    snap.forEach(doc => {
      const data = doc.data();
      const latDiff = Math.abs(data.latitude - lat);
      const lngDiff = Math.abs(data.longitude - lng);
      if (latDiff < ZONE_RADIUS && lngDiff < ZONE_RADIUS) nearbyCount++;
    });

    if (nearbyCount >= SOS_THRESHOLD) {
      await setDoc(doc(db, "dangerZones", `${lat.toFixed(4)}_${lng.toFixed(4)}`), {
        centerLat: lat,
        centerLng: lng,
        radius: ZONE_RADIUS,
        sosCount: nearbyCount,
        lastUpdated: serverTimestamp()
      });
    }
  };

  /* ---------------- FAKE CALL ---------------- */
  const toggleFakeCall = () => {
    setFakeCallActive(!fakeCallActive);
    alert(fakeCallActive ? "Call Ended" : "📞 Incoming Fake Call...");
  };

  /* ---------------- CONTACTS ---------------- */
  const saveContact = async () => {
  if (!contactName || !contactPhone) return alert("Enter details");

  await setDoc(doc(db, "users", user.uid, "contacts", contactPhone), {
    name: contactName,
    phone: contactPhone
  });

  setContacts([...contacts, { name: contactName, phone: contactPhone }]);
  setContactName("");
  setContactPhone("");
  alert("✅ Emergency Contact Saved");
};


  const shareSMSDemo = (contact) => {
    if (!location) return alert("Get live location first");
    const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    alert(`SOS ALERT 🚨\n${contact.name}\n${mapLink}`);
  };

  const shareWhatsApp = (contact) => {
    if (!location) return alert("Get live location first");
    const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    const message = `SOS ALERT 🚨\nUser needs help.\n\nLocation:\n${mapLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="user-box">
          <div className="user-icon">{user.email[0].toUpperCase()}</div>
          <div className="user-name">User</div>
        </div>

        <button className={`nav-btn ${page==="dashboard"?"active":""}`} onClick={()=>setPage("dashboard")}>Dashboard</button>
        <button className={`nav-btn ${page==="contacts"?"active":""}`} onClick={()=>setPage("contacts")}>Emergency Contacts</button>
        <button className={`nav-btn ${page==="history"?"active":""}`} onClick={()=>setPage("history")}>SOS History</button>
        <button className="nav-btn logout" onClick={onLogout}>Logout</button>
      </aside>

      <main className="dashboard">
        {page === "dashboard" && (
          <>
            <h2 className="title">Safety Dashboard</h2>
            <div className="grid">
              <div className="card">
                <h3>Fake Call</h3>
                <button className="btn blue" onClick={toggleFakeCall}>
                  {fakeCallActive ? "End Call" : "Call Me"}
                </button>
              </div>

              <div className={`card sos ${sosActive ? "pulse" : ""}`}>
                <h3>SOS</h3>
                <p className="timer">{formatTime(sosTime)}</p>
                {!sosActive
                  ? <button className="btn red" onClick={triggerSOS}>Trigger SOS</button>
                  : <button className="btn blue" onClick={stopSOS}>SOS Off</button>}
              </div>

              <div className={`card ${bubbleActive ? "safe" : ""}`}>
  <h3>🛡 Safety Bubble</h3>
  <p>Status: {bubbleActive ? "ACTIVE" : "OFF"}</p>

  <button
    className={`btn ${bubbleActive ? "red" : "green"}`}
    onClick={() => setBubbleActive(!bubbleActive)}
  >
    {bubbleActive ? "Turn OFF Bubble" : "Activate Bubble"}
  </button>
</div>


              <div className="card">
                <h3>📍 Live Location</h3>
                {location ? (
                  <>
                    <p>Latitude: {location.lat}</p>
                    <p>Longitude: {location.lng}</p>
                    <span className="live-badge online">🟢 LIVE</span>
                  </>
                ) : (
                  <>
                    <p>{locationError || "Not detected"}</p>
                    <span className="live-badge offline">🔴 OFFLINE</span>
                  </>
                )}
                <button className="btn green" onClick={getLiveLocation}>Get Live Location</button>
              </div>
            </div>
          </>
        )}

        {page === "contacts" && (
          <>
            <h2>Emergency Contacts</h2>
            <input placeholder="Name" value={contactName} onChange={e=>setContactName(e.target.value)} />
            <input placeholder="Phone Number" value={contactPhone} onChange={e=>setContactPhone(e.target.value)} />
            <button className="btn green" onClick={saveContact}>Save Contact</button>

            {contacts.map((c,i)=>(
              <div key={i} className="card">
                <strong>{c.name}</strong>
                <p>{c.phone}</p>
                <button className="btn blue" onClick={()=>shareWhatsApp(c)}>Share via WhatsApp</button>
                <button className="btn red" onClick={()=>shareSMSDemo(c)}>Share via SMS (Demo)</button>
              </div>
            ))}
          </>
        )}

        {page === "history" && (
          <>
            <h2>🚨 SOS History</h2>
            {sosHistory.length === 0 && <p>No SOS alerts yet</p>}
            {sosHistory.map((e,i)=>(
              <div key={i} className="card">
                <p><b>Type:</b> {e.triggerType}</p>
                <p><b>Time:</b> {e.timestamp?.seconds ? new Date(e.timestamp.seconds * 1000).toLocaleString() : "Loading..."}</p>
                <a href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`} target="_blank" rel="noreferrer" className="btn green">View Location</a>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
};
