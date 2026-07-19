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
  setDoc,
  deleteDoc,
  writeBatch
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

let currentUser = null;

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
    alert("ログアウトに失敗しました。");
  }
});

function createPlantData(plant, fallbackOrder = 0) {
  return {
    name: plant.name,
    lastWatered: plant.lastWatered,
    displayOrder: Number.isFinite(plant.displayOrder)
      ? plant.displayOrder
      : fallbackOrder,
    wateringInterval: Number.isInteger(plant.wateringInterval) &&
      plant.wateringInterval > 0
      ? plant.wateringInterval
      : 7
  };
}

async function savePlantsToFirestore(userId, plants) {
  try {
    const batch = writeBatch(db);

    plants.forEach((plant, index) => {
      const plantRef = doc(db, "users", userId, "plants", plant.id);

      batch.set(
        plantRef,
        createPlantData(plant, index),
        { merge: true }
      );
    });

    await batch.commit();
    console.log("植物一覧をFirestoreへ保存しました。");
  } catch (error) {
    console.error("Firestore保存失敗:", error);
  }
}

async function savePlantToFirestore(plant) {
  if (!currentUser) {
    console.log("未ログインのためFirestoreには保存しません。");
    return;
  }

  try {
    const plantRef = doc(
      db,
      "users",
      currentUser.uid,
      "plants",
      plant.id
    );

    await setDoc(
      plantRef,
      createPlantData(plant),
      { merge: true }
    );

    console.log("植物をFirestoreへ保存:", plant.name);
  } catch (error) {
    console.error("植物のFirestore保存失敗:", error);
  }
}

async function savePlantOrderToFirestore(plants) {
  if (!currentUser) {
    console.log("未ログインのため並び順をFirestoreには保存しません。");
    return;
  }

  try {
    const batch = writeBatch(db);

    plants.forEach((plant, index) => {
      const plantRef = doc(
        db,
        "users",
        currentUser.uid,
        "plants",
        plant.id
      );

      batch.set(
        plantRef,
        { displayOrder: index },
        { merge: true }
      );
    });

    await batch.commit();
    console.log("並び順をFirestoreへ保存しました。");
  } catch (error) {
    console.error("並び順のFirestore保存失敗:", error);
  }
}

async function deletePlantFromFirestore(plantId) {
  if (!currentUser) {
    console.log("未ログインのためFirestoreから削除しません。");
    return;
  }

  try {
    const plantRef = doc(
      db,
      "users",
      currentUser.uid,
      "plants",
      plantId
    );

    await deleteDoc(plantRef);
    console.log("植物をFirestoreから削除:", plantId);
  } catch (error) {
    console.error("植物のFirestore削除失敗:", error);
  }
}

function applyLegacyOrder(firestorePlants, localPlants) {
  const localOrder = new Map(
    localPlants.map((plant, index) => [plant.id, index])
  );

  return firestorePlants
    .map((plant, index) => ({
      ...plant,
      displayOrder: Number.isFinite(plant.displayOrder)
        ? plant.displayOrder
        : (localOrder.get(plant.id) ?? localPlants.length + index),
      wateringInterval: Number.isInteger(plant.wateringInterval) &&
        plant.wateringInterval > 0
        ? plant.wateringInterval
        : 7
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((plant, index) => ({
      ...plant,
      displayOrder: index
    }));
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
    const localPlants = window.getPlants();

    const firestorePlants = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    }));

    console.log("Firestoreから読み込み:", firestorePlants);

    if (firestorePlants.length > 0) {
      const orderedPlants = applyLegacyOrder(firestorePlants, localPlants);

      window.setPlants(orderedPlants);

      const needsDataMigration = firestorePlants.some(
        (plant) =>
          !Number.isFinite(plant.displayOrder) ||
          !Number.isInteger(plant.wateringInterval) ||
          plant.wateringInterval < 1
      );

      if (needsDataMigration) {
        await savePlantsToFirestore(userId, orderedPlants);
        console.log("既存データへ並び順・目安日数を追加しました。");
      }
    } else {
      console.log("Firestoreにはまだ植物データがありません。");

      await savePlantsToFirestore(userId, localPlants);
      console.log("localStorageの植物をFirestoreへ移行しました。");
    }
  } catch (error) {
    console.error("Firestore読み込み失敗:", error);
  }
}

window.savePlantToFirestore = savePlantToFirestore;
window.deletePlantFromFirestore = deletePlantFromFirestore;
window.savePlantOrderToFirestore = savePlantOrderToFirestore;

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

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
