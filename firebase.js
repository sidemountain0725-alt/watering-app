"use strict";

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFAmSgQDayXOa-Ib7A-kYUvU9odWYDDYI",
  authDomain: "watering-app-a08cf.firebaseapp.com",
  projectId: "watering-app-a08cf",
  storageBucket: "watering-app-a08cf.firebasestorage.app",
  messagingSenderId: "369821340152",
  appId: "1:369821340152:web:5303d5465f1d3dda9d460d"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const userInfo = document.getElementById("user-info");

loginButton.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("ログイン失敗:", error);
    alert(`ログインに失敗しました。\n${error.message}`);
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("ログアウト失敗:", error);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("ログイン成功:", user);

    userInfo.textContent =
      `${user.displayName ?? "ユーザー"}としてログイン中`;

    loginButton.hidden = true;
    logoutButton.hidden = false;
  } else {
    console.log("ログアウト状態");

    userInfo.textContent = "ログインしていません";
    loginButton.hidden = false;
    logoutButton.hidden = true;
  }
});

console.log("Firebase接続成功", app);




