// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCunortMGGyYB7LZn4dxd8kuvBanGy9e5w",
    authDomain: "collab-shopping-d3231.firebaseapp.com",
    projectId: "collab-shopping-d3231",
    storageBucket: "collab-shopping-d3231.firebasestorage.app",
    messagingSenderId: "1077679703321",
    appId: "1:1077679703321:web:ac6be4c623995a9386f188"
  };
const app = initializeApp(firebaseConfig);

// Export auth and database
export const auth = getAuth(app);
export const database = getDatabase(app);
