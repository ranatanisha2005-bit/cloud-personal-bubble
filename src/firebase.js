// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTa9pz85SW-JPAnuGjaGSih5g4H_tRors",
  authDomain: "cloud-personal-bubble-cfd2b.firebaseapp.com",
  projectId: "cloud-personal-bubble-cfd2b",
  storageBucket: "cloud-personal-bubble-cfd2b.firebasestorage.app",
  messagingSenderId: "17140123356",
  appId: "1:17140123356:web:ce610f58f52c3082361619",
  measurementId: "G-9SD1FL4TX9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


