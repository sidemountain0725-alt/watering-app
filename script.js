"use strict";

const STORAGE_KEY = "wateringAppPlants";

const defaultPlants = [
  {
    id: crypto.randomUUID(),
    name: "真柏",
    lastWatered: getTodayString()
  },
  {
    id: crypto.randomUUID(),
    name: "ストレリチア",
    lastWatered: getDateStringDaysAgo(1)
  }, 
  {
    id: crypto.randomUUID(),
    name: "アグラオネマ",
    lastWatered: getDateStringDaysAgo(2)
  },
 ];

let plants = loadPlants();

const plantList = document.getElementById("plantList");
const addPlantButton = document.getElementById("addPlantButton");

addPlantButton.addEventListener("click", addPlant);

renderPlants();

function loadPlants() {
  const savedPlants = localStorage.getItem(STORAGE_KEY);

  if (!savedPlants) {
    savePlants(defaultPlants);
    return defaultPlants;
  }

  try {
    const parsedPlants = JSON.parse(savedPlants);

    if (!Array.isArray(parsedPlants)) {
      throw new Error("保存データの形式が正しくありません。");
    }

    return parsedPlants;
  } catch (error) {
    console.error(error);
    savePlants(defaultPlants);
    return defaultPlants;
  }
}

function savePlants(plantData = plants) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plantData));
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

    card.innerHTML = `
      <div class="plant-card-header">
        <div>
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

    const waterButton = card.querySelector(".water-button");
    const renameButton = card.querySelector(".rename-button");
    const deleteButton = card.querySelector(".delete-button");

    waterButton.addEventListener("click", () => {
      waterPlant(plant.id);
    });

    renameButton.addEventListener("click", () => {
    renamePlant(plant.id);
    });

    deleteButton.addEventListener("click", () => {
      deletePlant(plant.id);
    });

    plantList.appendChild(card);
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

  plants.push({
    id: crypto.randomUUID(),
    name: trimmedName,
    lastWatered: getTodayString()
  });

  savePlants();
  renderPlants();
}

function waterPlant(plantId) {
  const plant = plants.find((item) => item.id === plantId);

  if (!plant) {
    return;
  }

  plant.lastWatered = getTodayString();

  savePlants();
  renderPlants();
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
}

function deletePlant(plantId) {
  const plant = plants.find((item) => item.id === plantId);

  if (!plant) {
    return;
  }

  const confirmed = window.confirm(
    `「${plant.name}」を削除しますか？`
  );

  if (!confirmed) {
    return;
  }

  plants = plants.filter((item) => item.id !== plantId);

  savePlants();
  renderPlants();
}

function calculateDaysAgo(dateString) {
  const lastWateredDate = parseLocalDate(dateString);
  const today = parseLocalDate(getTodayString());

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const difference = today.getTime() - lastWateredDate.getTime();

  return Math.max(0, Math.floor(difference / millisecondsPerDay));
}

function getTodayString() {
  const today = new Date();

  return formatLocalDate(today);
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
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.renderPlants = renderPlants;
window.setPlants = function(newPlants) {
  plants = newPlants;
  renderPlants();
};
window.getPlants = function () {
  return plants;
};