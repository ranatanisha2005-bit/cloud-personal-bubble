import { useState, useEffect } from "react";
import "./Dashboard.css";

export default function Dashboard({ user, onLogout }) {
  const [bubbleActive, setBubbleActive] = useState(false);
  const [bubbleTime, setBubbleTime] = useState(0);

  const [sosActive, setSosActive] = useState(false);
  const [sosTime, setSosTime] = useState(0);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  const [safetyStatus, setSafetyStatus] = useState("");
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    let timer;
    if (bubbleActive) {
      timer = setInterval(() => setBubbleTime((t) => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [bubbleActive]);

  useEffect(() => {
    let timer;
    if (sosActive) {
      timer = setInterval(() => setSosTime((t) => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [sosActive]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const startBubble = () => {
    setBubbleActive(true);
    setBubbleTime(0);
  };

  const stopBubble = () => {
    setBubbleActive(false);
    setBubbleTime(0);
  };

  const triggerSOS = () => {
    setSosActive(true);
    setSosTime(0);
    alert("🚨 SOS Triggered! Emergency contacts will be notified.");
  };

  const stopSOS = () => {
    setSosActive(false);
    setSosTime(0);
  };

  // 🔥 SEND LOCATION TO BACKEND
  const sendLocationToBackend = async (coords) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/updateLocation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.uid,
            latitude: coords.lat,
            longitude: coords.lng,
          }),
        }
      );

      const data = await response.json();
      console.log("✅ Backend response:", data);

      setSafetyStatus(data.safetyStatus);
      setDistance(data.distanceFromNearestSafeZone); // ✅ FIXED
    } catch (error) {
      console.error("❌ Error sending location:", error);
    }
  };

  // 📍 GET LIVE LOCATION
  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        };

        setLocation(coords);
        setLocationError("");

        sendLocationToBackend(coords);
      },
      () => setLocationError("Location permission denied")
    );
  };

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="user-box">
          <div className="user-icon">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="user-name">User</div>
        </div>

        <button className="nav-btn active">Dashboard</button>
        <button className="nav-btn">Emergency Contact</button>
        <button className="nav-btn">Settings</button>
        <button className="nav-btn logout" onClick={onLogout}>
          Logout
        </button>
      </aside>

      {/* CENTER */}
      <main className="dashboard">
        <h2>Safety Dashboard</h2>

        <div className="grid">
          <div className="card safe">
            <h3>STATUS</h3>

            {safetyStatus && (
              <div
                className={`status-card ${
                  safetyStatus === "SAFE"
                    ? "status-safe"
                    : safetyStatus === "CAUTION"
                    ? "status-caution"
                    : "status-unsafe"
                }`}
              >
                {safetyStatus === "SAFE" && "✅ You are in a Safe Zone"}
                {safetyStatus === "CAUTION" && "⚠️ Caution: Near Safe Zone"}
                {safetyStatus === "UNSAFE" && "🚨 UNSAFE AREA"}

                {Number.isFinite(distance) && (
                  <div className="status-distance">
                    Distance: {Math.round(distance)} m
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h3>Start Safety Bubble</h3>
            <p className="timer">{formatTime(bubbleTime)}</p>
            <p className="small">
              Status: {bubbleActive ? "Active" : "Inactive"}
            </p>

            {!bubbleActive ? (
              <button className="btn green full" onClick={startBubble}>
                Activate
              </button>
            ) : (
              <button className="btn red full" onClick={stopBubble}>
                Deactivate
              </button>
            )}
          </div>

          <div className="card bubble">
            <h3>Fake Call</h3>
            <button className="btn blue full">Call Me</button>
          </div>

          <div className="card sos">
            <h3>SOS</h3>
            <p className="timer">{formatTime(sosTime)}</p>
            <p className="small">
              Status: {sosActive ? "Triggered" : "Inactive"}
            </p>

            {!sosActive ? (
              <button className="btn red full" onClick={triggerSOS}>
                Trigger SOS
              </button>
            ) : (
              <button className="btn blue full" onClick={stopSOS}>
                SOS Alert Off
              </button>
            )}
          </div>

          <div className="card">
            <h3>📍 Live Location</h3>

            {location ? (
              <>
                <p className="small">Latitude: {location.lat}</p>
                <p className="small">Longitude: {location.lng}</p>
                <span className="status live">Live</span>
              </>
            ) : (
              <p className="small">
                {locationError || "Location not fetched"}
              </p>
            )}

            <button className="btn green full" onClick={getLiveLocation}>
              Get Live Location
            </button>
          </div>
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside className="right-panel">
        <h3>Emergency Contact</h3>
        <input placeholder="Name" />
        <input placeholder="Phone Number" />
        <button className="btn green full">Save Contact</button>
      </aside>
    </div>
  );
}
