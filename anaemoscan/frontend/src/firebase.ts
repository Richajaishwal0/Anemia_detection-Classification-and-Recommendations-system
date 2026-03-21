import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_W4qSYmsjBXi4ZVneyOTTq21WU9wFgdM",
  authDomain: "dev-elevate-363ff.firebaseapp.com",
  projectId: "dev-elevate-363ff",
  storageBucket: "dev-elevate-363ff.firebasestorage.app",
  messagingSenderId: "706931873309",
  appId: "1:706931873309:web:12f1de34d84beef7a958f4",
  measurementId: "G-ZX7XBGPFQR",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
