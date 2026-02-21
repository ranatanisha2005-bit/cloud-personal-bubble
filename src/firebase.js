// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADpiYT_wGKLAWCd-DqTTGyX2L00reRgBU",
  authDomain: "cloud-personal-bubble.firebaseapp.com",
  projectId: "cloud-personal-bubble",
  storageBucket: "cloud-personal-bubble.firebasestorage.app",
  messagingSenderId: "1069639997798",
  appId: "1:1069639997798:web:716fd7f3787530df3090a7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
