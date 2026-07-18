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

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc
} from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

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
const db = getFirestore(app);
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

async function savePlantsToFirestore(userId, plants) {
  try {
    for (const plant of plants) {
      const plantRef = doc(
        db,
        "users",
        userId,
        "plants",
        plant.id
      );

      await setDoc(plantRef, {
        name: plant.name,
        lastWatered: plant.lastWatered
      });
    }

    console.log("Firestoreへ保存成功");
  } catch (error) {
    console.error("Firestore保存失敗:", error);
  }
}

async function loadPlantsFromFirestore(userId) {
  try {
    const plantsCollection = collection(
      db,
      "users",
      userId,
      "plants"
    );

    const snapshot = await getDocs(plantsCollection);

    const firestorePlants = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    console.log("Firestoreから読み込み:", firestorePlants);

  if (firestorePlants.length > 0) {
  window.setPlants(firestorePlants);
} else {
  console.log("Firestoreにはまだ植物データがありません");

  const localPlants = window.getPlants();

  await savePlantsToFirestore(userId, localPlants);

  console.log("localStorageの植物をFirestoreへ移行しました");
}
  } catch (error) {
    console.error("Firestore読み込み失敗:", error);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("ログイン成功:", user);

    userInfo.textContent =
      `${user.displayName ?? "ユーザー"}としてログイン中`;

    loginButton.hidden = true;
    logoutButton.hidden = false;

    await loadPlantsFromFirestore(user.uid);
  } else {
    console.log("ログアウト状態");

    userInfo.textContent = "ログインしていません";
    loginButton.hidden = false;
    logoutButton.hidden = true;
  }
});

console.log("Firebase接続成功", app);




