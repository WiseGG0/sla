const materials = ["Grama", "Madeira", "Pedra", "Cobre", "Ferro"];
const unlockCosts = [0, 1000, 5000, 10000, 25000];
const resources = {};
let coins = 0;
let prestige = 0;
let autoIntervals = {};

function initResource(name, index) {
  resources[name] = {
    count: 0,
    perSecond: 0,
    autoEnabled: false,
    interval: 20000,
    upgrades: [0, 0, 0], // [upgrade de clique, perSecond, intervalo reduzido]
    unlocked: index === 0
  };
  updateResourceUI(name);
}

function updateResourceUI(name) {
  const res = resources[name];
  let div = document.getElementById(`res-${name}`);
  if (!div) {
    div = document.createElement("div");
    div.className = "resource";
    div.id = `res-${name}`;
    document.getElementById("resources").appendChild(div);
  }
  div.innerHTML = `
    <h3>${name}</h3>
    <p>${name}s: <span id="count-${name}">${res.count.toFixed(0)}</span></p>
    <p>${name}/s: <span id="ps-${name}">${res.perSecond}</span></p>
    <button onclick="mine('${name}')">Coletar ${name} (x${1 + res.upgrades[0] + prestige} por clique)</button><br>
    <button onclick="buyUpgrade('${name}', 0)">Aumentar clique (Nv ${res.upgrades[0]}) - Custo: ${calcUpgradeCost(res.upgrades[0], 0)}</button>
    <button onclick="buyUpgrade('${name}', 1)">+1/s automático (Nv ${res.upgrades[1]}) - Custo: ${calcUpgradeCost(res.upgrades[1], 1)}</button>
    <button onclick="buyUpgrade('${name}', 2)">Reduzir tempo automático (Nv ${res.upgrades[2]}) - Custo: ${calcUpgradeCost(res.upgrades[2], 2)}</button>
  `;
  div.style.display = res.unlocked ? "block" : "none";
}

function calcUpgradeCost(level, type) {
  const baseCosts = [10, 20, 30];
  return Math.floor(baseCosts[type] * (level + 1) ** 1.7);
}

function mine(name) {
  const res = resources[name];
  const gain = 1 + res.upgrades[0] + prestige;
  res.count += gain;
  checkUnlocks();
  updateResourceUI(name);
  saveGame();
}

function buyUpgrade(name, type) {
  const res = resources[name];
  const cost = calcUpgradeCost(res.upgrades[type], type);
  if (res.count >= cost) {
    res.count -= cost;
    res.upgrades[type]++;
    if (type === 1) {
      // Upgrade automático +1/s
      res.perSecond++;
      if (!res.autoEnabled) startAutoProduction(name);
    }
    if (type === 2) {
      // Reduz intervalo de produção automática
      res.interval = Math.max(1000, res.interval - 1000);
      if (res.autoEnabled) {
        clearInterval(autoIntervals[name]);
        autoIntervals[name] = setInterval(() => {
          res.count += 1 + prestige;
          updateResourceUI(name);
          saveGame();
        }, res.interval);
      }
    }
    updateResourceUI(name);
    saveGame();
  }
}

function startAutoProduction(name) {
  const res = resources[name];
  res.autoEnabled = true;
  if (autoIntervals[name]) clearInterval(autoIntervals[name]);
  autoIntervals[name] = setInterval(() => {
    res.count += 1 + prestige;
    updateResourceUI(name);
    saveGame();
  }, res.interval);
}

function checkUnlocks() {
  for (let i = 1; i < materials.length; i++) {
    const mat = materials[i];
    const prev = materials[i - 1];
    if (!resources[mat].unlocked && resources[prev].count >= unlockCosts[i]) {
      resources[mat].unlocked = true;
      updateResourceUI(mat);
    }
  }
}

function updatePerSecond() {
  materials.forEach(name => {
    const res = resources[name];
    res.count += res.perSecond;
    updateResourceUI(name);
  });
  saveGame();
}

function setupShop() {
  const shop = document.getElementById("shop");
  shop.innerHTML = '';
  materials.forEach(name => {
    const btn = document.createElement("button");
    btn.innerText = `Vender ${name} - 1 moeda por unidade`;
    btn.onclick = () => {
      coins += resources[name].count;
      resources[name].count = 0;
      document.getElementById("coins").innerText = coins;
      updateResourceUI(name);
      saveGame();
    };
    shop.appendChild(btn);
  });
}

function resetGame() {
  if (!confirm("Tem certeza que deseja resetar o progresso?")) return;
  localStorage.removeItem("mineclicker-save");
  location.reload();
}

function saveGame() {
  localStorage.setItem("mineclicker-save", JSON.stringify({ resources, coins, prestige }));
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem("mineclicker-save"));
  if (!data) return;
  Object.assign(resources, data.resources);
  coins = data.coins;
  prestige = data.prestige;
  materials.forEach(name => {
    updateResourceUI(name);
    if (resources[name].autoEnabled) startAutoProduction(name);
  });
  document.getElementById("coins").innerText = coins;
}

function prestigeGame() {
  if (coins < 10000) return alert("Você precisa de pelo menos 10.000 moedas para usar o prestígio!");
  prestige++;
  coins = 0;
  materials.forEach(name => {
    resources[name].count = 0;
    resources[name].perSecond = 0;
    resources[name].autoEnabled = false;
    resources[name].upgrades = [0, 0, 0];
    resources[name].interval = 20000;
    resources[name].unlocked = name === "Grama";
    if (autoIntervals[name]) clearInterval(autoIntervals[name]);
  });
  saveGame();
  location.reload();
}

document.getElementById("prestige-btn").onclick = prestigeGame;
document.getElementById("reset-btn").onclick = resetGame;

materials.forEach((mat, i) => initResource(mat, i));
setupShop();
loadGame();
setInterval(updatePerSecond, 1000);
