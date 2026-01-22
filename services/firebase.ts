import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBr913nCvHLfPbJSEHwXNcVXJ__k1ml4y0",
  authDomain: "myself-ide.firebaseapp.com",
  databaseURL: "https://myself-ide-default-rtdb.firebaseio.com",
  projectId: "myself-ide",
  storageBucket: "myself-ide.firebasestorage.app",
  messagingSenderId: "597822184399",
  appId: "1:597822184399:web:8430cbaff05274e999d0ba",
  measurementId: "G-YSM6G9YMWX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;