"use strict";

const STORAGE_KEY = "wateringAppPlants";

const defaultPlants = [
  {
    id: crypto.randomUUID(),
    name: "真柏",
    lastWatered: getTodayString(),
    displayOrder: 0
  },
  {
    id: crypto.randomUUID(),
    name: "ストレリチア",
    lastWatered: getDateStringDaysAgo(1),
    displayOrder: 1
  },
  {
    id: crypto.randomUUID(),
    name: "アグラオネマ",
    lastWatered: getDateStringDaysAgo(2),
    displayOrder: 2
  }
];

let plants = loadPlants();
let sortable = null;

const plantList = document.getElementById("plantList");
const addPlantButton = document.getElementById("addPlantButton");

addPlantButton.addEventListener("click", addPlant);

renderPlants();
initializeSortable();

function loadPlants() {
  const savedPlants = localStorage.getItem(STORAGE_KEY);

  if (!savedPlants) {
    const initialPlants = normalizePlantOrder(defaultPlants);
    savePlants(initialPlants);
    return initialPlants;
  }

  try {
    const parsedPlants = JSON.parse(savedPlants);

    if (!Array.isArray(parsedPlants)) {
      throw new Error("保存データの形式が正しくありません。");
    }

    return normalizePlantOrder(parsedPlants);
  } catch (error) {
    console.error("localStorageの読み込みに失敗しました:", error);

    const initialPlants = normalizePlantOrder(defaultPlants);
    savePlants(initialPlants);
    return initialPlants;
  }
}

function savePlants(plantData = plants) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plantData));
}

function normalizePlantOrder(plantData) {
  return [...plantData]
    .map((plant, index) => ({
      ...plant,
      displayOrder: Number.isFinite(plant.displayOrder)
        ? plant.displayOrder
        : index
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((plant, index) => ({
      ...plant,
      displayOrder: index
    }));
}

function renderPlants() {
  plantList.innerHTML = "";

  if (plants.length === 0) {
    plantList.innerHTML = `
      <div class="empty-message">
        植物がまだ登録されていません。<br>
        「植物を追加」から登録してください。
      </div>
    `;
    return;
  }

  plants.forEach((plant) => {
    const daysAgo = calculateDaysAgo(plant.lastWatered);
    const card = document.createElement("article");

    card.className = "plant-card";
    card.dataset.id = plant.id;

    card.innerHTML = `
      <div class="plant-card-header">
        <button
          class="drag-handle"
          type="button"
          aria-label="${escapeHtml(plant.name)}を並び替え"
          title="ドラッグして並び替え"
        >
          <span aria-hidden="true">⋮⋮</span>
        </button>

        <div class="plant-summary">
          <h2 class="plant-name">${escapeHtml(plant.name)}</h2>

          <p class="last-watered">
            最後の水やりから
            <span class="days-number">${daysAgo}日</span>
          </p>
        </div>

        <div class="card-actions">
          <button
            class="rename-button"
            type="button"
            aria-label="${escapeHtml(plant.name)}の名前を変更"
          >
            名前変更
          </button>

          <button
            class="delete-button"
            type="button"
            aria-label="${escapeHtml(plant.name)}を削除"
          >
            削除
          </button>
        </div>
      </div>

      <button class="water-button" type="button">
        水やりした
      </button>
    `;

    card.querySelector(".water-button").addEventListener("click", () => {
      waterPlant(plant.id);
    });

    card.querySelector(".rename-button").addEventListener("click", () => {
      renamePlant(plant.id);
    });

    card.querySelector(".delete-button").addEventListener("click", () => {
      deletePlant(plant.id);
    });

    plantList.appendChild(card);
  });
}

function initializeSortable() {
  if (typeof Sortable === "undefined") {
    console.error("SortableJSを読み込めませんでした。");
    return;
  }

  sortable = Sortable.create(plantList, {
    animation: 180,
    handle: ".drag-handle",
    draggable: ".plant-card",
    dataIdAttr: "data-id",
    delay: 180,
    delayOnTouchOnly: true,
    touchStartThreshold: 4,
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",

    onEnd() {
      const orderedIds = sortable.toArray();
      const plantsById = new Map(plants.map((plant) => [plant.id, plant]));

      plants = orderedIds
        .map((id) => plantsById.get(id))
        .filter(Boolean)
        .map((plant, index) => ({
          ...plant,
          displayOrder: index
        }));

      savePlants();
      savePlantOrderToCloud();
    }
  });
}

function addPlant() {
  const plantName = window.prompt("植物の名前を入力してください。");

  if (plantName === null) {
    return;
  }

  const trimmedName = plantName.trim();

  if (trimmedName === "") {
    window.alert("植物の名前を入力してください。");
    return;
  }

  const newPlant = {
    id: crypto.randomUUID(),
    name: trimmedName,
    lastWatered: getTodayString(),
    displayOrder: plants.length
  };

  plants.push(newPlant);

  savePlants();
  renderPlants();
  savePlantToCloud(newPlant);
}

function waterPlant(plantId) {
  const plant = plants.find((item) => item.id === plantId);

  if (!plant) {
    return;
  }

  plant.lastWatered = getTodayString();

  savePlants();
  renderPlants();
  savePlantToCloud(plant);
}

function renamePlant(plantId) {
  const plant = plants.find((item) => item.id === plantId);

  if (!plant) {
    return;
  }

  const newName = window.prompt(
    "新しい植物名を入力してください。",
    plant.name
  );

  if (newName === null) {
    return;
  }

  const trimmedName = newName.trim();

  if (trimmedName === "") {
    window.alert("植物の名前を入力してください。");
    return;
  }

  plant.name = trimmedName;

  savePlants();
  renderPlants();
  savePlantToCloud(plant);
}

function deletePlant(plantId) {
  const plant = plants.find((item) => item.id === plantId);

  if (!plant) {
    return;
  }

  const confirmed = window.confirm(`「${plant.name}」を削除しますか？`);

  if (!confirmed) {
    return;
  }

  plants = normalizePlantOrder(
    plants.filter((item) => item.id !== plantId)
  );

  savePlants();
  renderPlants();
  deletePlantFromCloud(plantId);
  savePlantOrderToCloud();
}

function savePlantToCloud(plant) {
  if (typeof window.savePlantToFirestore === "function") {
    window.savePlantToFirestore(plant);
  } else {
    console.warn("Firestore保存機能がまだ準備できていません。");
  }
}

function deletePlantFromCloud(plantId) {
  if (typeof window.deletePlantFromFirestore === "function") {
    window.deletePlantFromFirestore(plantId);
  } else {
    console.warn("Firestore削除機能がまだ準備できていません。");
  }
}

function savePlantOrderToCloud() {
  if (typeof window.savePlantOrderToFirestore === "function") {
    window.savePlantOrderToFirestore(plants);
  } else {
    console.warn("Firestoreの並び順保存機能がまだ準備できていません。");
  }
}

function calculateDaysAgo(dateString) {
  const lastWateredDate = parseLocalDate(dateString);
  const today = parseLocalDate(getTodayString());

  if (
    Number.isNaN(lastWateredDate.getTime()) ||
    Number.isNaN(today.getTime())
  ) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const difference = today.getTime() - lastWateredDate.getTime();

  return Math.max(0, Math.floor(difference / millisecondsPerDay));
}

function getTodayString() {
  return formatLocalDate(new Date());
}

function getDateStringDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return formatLocalDate(date);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString) {
  const [year, month, day] = String(dateString)
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.renderPlants = renderPlants;

window.setPlants = function (newPlants) {
  if (!Array.isArray(newPlants)) {
    console.error("植物データの形式が正しくありません。");
    return;
  }

  plants = normalizePlantOrder(newPlants);
  savePlants();
  renderPlants();
};

window.getPlants = function () {
  return plants.map((plant) => ({ ...plant }));
};
