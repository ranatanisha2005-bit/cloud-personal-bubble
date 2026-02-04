import { useState, useEffect } from "react";
import "./Dashboard.css";
import { db } from "./firebase";
import { doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";

export default function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [sosActive, setSosActive] = useState(false);
  const [fakeCallActive, setFakeCallActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contacts, setContacts] = useState([]);
  const [sosHistory, setSosHistory] = useState([]);

  useEffect(() => {
    if (page === "contacts") loadContacts();
    if (page === "history") loadSOSHistory();
  }, [page]);

  const loadContacts = async () => {
    const snap = await getDocs(collection(db, "emergencyContacts"));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.uid === user.uid);
    setContacts(list);
  };

  const loadSOSHistory = async () => {
    const snap = await getDocs(collection(db, "sosEvents"));
    let list = snap.docs.map(d => d.data()).filter(e => e.uid === user.uid).reverse();

    if (list.length === 0) {
      list = [
        { type: "AUTO", time: "Yesterday 8:42 PM", mapLink: "https://www.google.com/maps?q=28.6139,77.2090" },
        { type: "MANUAL", time: "Today 10:15 AM", mapLink: "https://www.google.com/maps?q=28.5672,77.2100" }
      ];
    }
    setSosHistory(list);
  };

  const getLiveLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5)
        });
        setLocationError("");
      },
      () => setLocationError("Location permission denied")
    );
  };

  const toggleFakeCall = () => {
    setFakeCallActive(!fakeCallActive);
    alert(fakeCallActive ? "Call Ended" : "📞 Incoming Fake Call...");
  };

  const triggerSOS = async () => {
    if (!location) return alert("Get live location first");

    const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    setSosActive(true);

    await setDoc(doc(db, "sosEvents", Date.now().toString()), {
      uid: user.uid,
      latitude: location.lat,
      longitude: location.lng,
      mapLink,
      type: "MANUAL",
      time: new Date().toLocaleString()
    });

    alert(`🚨 SOS SENT!\n\n${mapLink}`);
  };

  const saveContact = async () => {
    if (!contactName || !contactPhone) return alert("Enter details");

    await setDoc(doc(db, "emergencyContacts", Date.now().toString()), {
      name: contactName,
      phone: contactPhone,
      uid: user.uid
    });

    setContactName("");
    setContactPhone("");
    loadContacts();
  };

  const deleteContact = async (id) => {
    await deleteDoc(doc(db, "emergencyContacts", id));
    loadContacts();
  };

  const shareOnWhatsApp = (contact) => {
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
            <h2>Safety Dashboard</h2>
            <div className="grid">
              <div className="card">
                <h3>Fake Call</h3>
                <button className="btn blue full" onClick={toggleFakeCall}>
                  {fakeCallActive ? "End Call" : "Incoming Call"}
                </button>
              </div>

              <div className="card sos">
                <h3>SOS</h3>
                <button className="btn red full" onClick={triggerSOS}>Trigger SOS</button>
              </div>

              <div className="card">
                <h3>Live Location</h3>
                {location ? <p>{location.lat}, {location.lng}</p> : <p>{locationError || "Not detected"}</p>}
                <button className="btn green full" onClick={getLiveLocation}>Get Live Location</button>
              </div>
            </div>
          </>
        )}

        {page === "contacts" && (
          <>
            <h2>Emergency Contacts</h2>
            <input placeholder="Name" value={contactName} onChange={e=>setContactName(e.target.value)} />
            <input placeholder="Phone" value={contactPhone} onChange={e=>setContactPhone(e.target.value)} />
            <button className="btn green full" onClick={saveContact}>Add Contact</button>

            {contacts.map(c => (
              <div key={c.id} className="card">
                <strong>{c.name}</strong>
                <p>{c.phone}</p>
                <button className="btn green full" onClick={()=>shareOnWhatsApp(c)}>Share via WhatsApp</button>
                <button className="btn red full" onClick={()=>deleteContact(c.id)}>Delete</button>
              </div>
            ))}
          </>
        )}

        {page === "history" && (
          <>
            <h2>🚨 SOS History</h2>
            {sosHistory.map((e,i)=>(
              <div key={i} className="card">
                <p><b>Type:</b> {e.type}</p>
                <p><b>Time:</b> {e.time}</p>
                <a href={e.mapLink} target="_blank" rel="noreferrer" className="btn green full">View Location</a>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
