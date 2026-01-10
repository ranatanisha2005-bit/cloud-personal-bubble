import { useState, useEffect } from "react";
import "./Dashboard.css";

export default function Dashboard({ user, onLogout }) {
  const [bubbleActive, setBubbleActive] = useState(false);
  const [bubbleTime, setBubbleTime] = useState(0);

  const [sosActive, setSosActive] = useState(false);
  const [sosTime, setSosTime] = useState(0);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

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
  }

  const stopSOS = () => {
    setSosActive(false);
    setSosTime(0);
  }

  const triggerSOS = () => {
    setSosActive(true);
    setSosTime(0);
    alert("🚨 SOS Triggered! Emergency contacts will be notified.");
  };

  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
        });
        setLocationError("");
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
          <div className="user-name">User Name</div>
        </div>

        <button className="nav-btn active">Dashboard</button>
        <button className="nav-btn">Emergency Contact</button>
        <button className="nav-btn">Settings</button>
        <button className="nav-btn logout" onClick={onLogout}>Logout</button>
      </aside>

      {/* CENTER */}
      <main className="dashboard">
        <h2>Safety Dashboard</h2>

        <div className="grid">

          {/* SAFE */}
          <div className="card safe">
            <h3>SAFE</h3>
            <p className="small">Location Active</p>
            <p className="small">
              Bubble: {bubbleActive ? "Active" : "Inactive"}
            </p>
          </div>

          {/* Bubble Controller */}
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

          {/* Fake Call (moved here) */}
          <div className="card bubble">
            <h3>Fake Call</h3>
            <button className="btn blue full">Call Me</button>
          </div>

          {/* SOS */}
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

          {/* Live Location */}
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
