"use strict";

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";


const firebaseConfig = {
  apiKey: "AIzaSyDFAmSgQDayXOa-Ib7A-kYUvU9odWYDDYI",
  authDomain: "watering-app-a08cf.firebaseapp.com",
  projectId: "watering-app-a08cf",
  storageBucket: "watering-app-a08cf.firebasestorage.app",
  messagingSenderId: "369821340152",
  appId: "1:369821340152:web:5303d5465f1d3dda9d460d"
};


const app = initializeApp(firebaseConfig);

console.log("Firebase接続成功", app);