import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAftZ4N8qU9c_ysYAUTtujlJj3twWRFcNM",
  authDomain: "fichas-prevencar.firebaseapp.com",
  projectId: "fichas-prevencar",
  storageBucket: "fichas-prevencar.firebasestorage.app",
  messagingSenderId: "996829895570",
  appId: "1:996829895570:web:dc3e88ee3c0e4967457f4b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
