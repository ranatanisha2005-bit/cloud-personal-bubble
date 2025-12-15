import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./Auth";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  return (
    <div>
      {user ? (
        <div>
          <h2>Welcome {user.email}</h2>
          <button onClick={() => signOut(auth)}>Logout</button>
          </div>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;