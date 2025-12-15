import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";
import Profile from "./Profile";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      {user ? (
        <div>
          <h2>Welcome {user.email}</h2>

          <button onClick={() => signOut(auth)}>
            Logout
          </button>

          <hr />

          {/* Profile Component */}
          <Profile user={user} />
        </div>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;
