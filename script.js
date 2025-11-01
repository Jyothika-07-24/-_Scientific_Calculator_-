// script.js - Fully Working Scientific Calculator

let sciMode = false;
let degMode = true;
let darkTheme = localStorage.getItem("theme") !== "light";
let chartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  // apply saved theme
  if (!darkTheme) document.body.classList.add("light-mode");
  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) themeBtn.innerText = darkTheme ? "🌙" : "☀️";

  // attach keyboard listener
  window.addEventListener("keydown", handleKey);
});

// --- Basic UI functions ---
function appendValue(val) {
  const d = document.getElementById("display");
  if (d) d.value = (d.value || "") + val;
}

function clearDisplay() {
  const d = document.getElementById("display");
  if (d) d.value = "";
}

function deleteLast() {
  const d = document.getElementById("display");
  if (d) d.value = d.value.slice(0, -1);
}

function toggleTheme() {
  darkTheme = !darkTheme;
  document.body.classList.toggle("light-mode", !darkTheme);
  localStorage.setItem("theme", darkTheme ? "dark" : "light");
  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) themeBtn.innerText = darkTheme ? "🌙" : "☀️";
}

function toggleDegRad() {
  degMode = !degMode;
  const m = document.getElementById("modeBtn");
  if (m) m.innerText = degMode ? "DEG" : "RAD";
}

function toggleSciMode() {
  sciMode = !sciMode;
  const s = document.getElementById("sciBtn");
  if (s) s.innerText = sciMode ? "SCI ON" : "SCI OFF";
  const d = document.getElementById("display");
  if (d && d.value.trim() !== "" && !isNaN(Number(d.value))) {
    d.value = sciMode ? Number(d.value).toExponential(5) : String(Number(d.value));
  }
}

// --- Calculation Logic ---
function calculate() {
  try {
    const d = document.getElementById("display");
    if (!d) return;
    let expr = d.value;

    expr = expr.replace(/π|pi/g, "Math.PI")
      .replace(/\be\b/g, "Math.E")
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/∛\(/g, "Math.cbrt(")
      .replace(/\^/g, "**")
      .replace(/\s+/g, "");

    expr = expr.replace(/(\d+(\.\d+)?)%/g, "($1/100)");

    function replaceInnermost(fnName, replacementFn) {
      const regex = new RegExp(fnName + "\\(([^()]+)\\)");
      let loops = 0;
      while (regex.test(expr) && loops < 1000) {
        expr = expr.replace(regex, (m, inner) => replacementFn(inner));
        loops++;
      }
    }

    if (degMode) {
      replaceInnermost("sin", inner => `Math.sin((${inner})*Math.PI/180)`);
      replaceInnermost("cos", inner => `Math.cos((${inner})*Math.PI/180)`);
      replaceInnermost("tan", inner => `Math.tan((${inner})*Math.PI/180)`);
    } else {
      replaceInnermost("sin", inner => `Math.sin((${inner}))`);
      replaceInnermost("cos", inner => `Math.cos((${inner}))`);
      replaceInnermost("tan", inner => `Math.tan((${inner}))`);
    }

    replaceInnermost("log", inner => `Math.log10((${inner}))`);
    replaceInnermost("sqrt", inner => `Math.sqrt((${inner}))`);
    replaceInnermost("cbrt", inner => `Math.cbrt((${inner}))`);

    expr = expr.replace(/(\d+(\.\d+)?)!/g, (m, n) => {
      const val = Number(n);
      return Number.isFinite(val) && val >= 0 && Math.floor(val) === val
        ? factorial(val)
        : "NaN";
    });

    const resultRaw = Function('"use strict"; return (' + expr + ')')();
    if (!isFinite(resultRaw)) throw new Error("Math error");

    const result = sciMode ? Number(resultRaw).toExponential(6) : Number(resultRaw);
    d.value = result;
    saveToHistory(expr, result);
  } catch (err) {
    const d = document.getElementById("display");
    if (d) d.value = "Error";
  }
}

function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function saveToHistory(expression, result) {
  try {
    const key = "calcHistory";
    const raw = localStorage.getItem(key);
    let history = raw ? JSON.parse(raw) : [];
    history.unshift({ expression, result, time: new Date().toLocaleString() });
    if (history.length > 200) history = history.slice(0, 200);
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.warn("history save failed", e);
  }
}

// --- Graph Functionality ---
function toggleGraph() {
  const expr = document.getElementById("display").value;
  const graphContainer = document.getElementById("graphContainer");
  if (!graphContainer) return;

  if (!expr.includes("x")) {
    alert("Please include 'x' in your expression (e.g., sin(x) or x^2)");
    return;
  }

  graphContainer.classList.toggle("hidden");
  if (!graphContainer.classList.contains("hidden")) {
    drawGraph(expr);
  }
}

function drawGraph(exprOriginal) {
  const canvas = document.getElementById("graphCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const xs = [];
  const ys = [];

  for (let x = -10; x <= 10; x += 0.25) {
    let e = exprOriginal.replace(/π|pi/g, "Math.PI").replace(/\be\b/g, "Math.E").replace(/\^/g, "**");
    e = e.replace(/x/g, `(${x})`);
    if (degMode) {
      e = e.replace(/sin\(([^)]+)\)/g, (m, a) => `Math.sin((${a})*Math.PI/180)`);
      e = e.replace(/cos\(([^)]+)\)/g, (m, a) => `Math.cos((${a})*Math.PI/180)`);
      e = e.replace(/tan\(([^)]+)\)/g, (m, a) => `Math.tan((${a})*Math.PI/180)`);
    } else {
      e = e.replace(/sin\(([^)]+)\)/g, (m, a) => `Math.sin((${a}))`);
      e = e.replace(/cos\(([^)]+)\)/g, (m, a) => `Math.cos((${a}))`);
      e = e.replace(/tan\(([^)]+)\)/g, (m, a) => `Math.tan((${a}))`);
    }
    try {
      const y = Function('"use strict"; return (' + e + ')')();
      xs.push(Number(x.toFixed(2)));
      ys.push(Number.isFinite(y) ? y : null);
    } catch {
      xs.push(Number(x.toFixed(2)));
      ys.push(null);
    }
  }

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: xs,
      datasets: [{
        label: exprOriginal,
        data: ys,
        borderColor: "#ff9800",
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "x" } },
        y: { title: { display: true, text: "f(x)" } }
      }
    }
  });
}

// --- Keyboard input support ---
const keyMap = {
  s: "sin(", S: "sin(",
  c: "cos(", C: "cos(",
  t: "tan(", T: "tan(",
  l: "log(", L: "log(",
  r: "sqrt(", R: "sqrt(",
  p: "pi", P: "pi",
  e: "e", E: "e",
};

function handleKey(e) {
  const key = e.key;

  if (key === "Enter") { e.preventDefault(); calculate(); return; }
  if (key === "Backspace") { e.preventDefault(); deleteLast(); return; }
  if (key === "Escape") { e.preventDefault(); clearDisplay(); return; }

  if (key === "g" || key === "G") { e.preventDefault(); toggleGraph(); return; }
  if (key === "i" || key === "I") { e.preventDefault(); toggleSciMode(); return; }

  const allowed = "0123456789.+-*/^()%,"; // includes comma and parentheses
  if (allowed.includes(key)) {
    e.preventDefault();
    appendValue(key);
    return;
  }

  if (keyMap[key]) {
    e.preventDefault();
    appendValue(keyMap[key]);
  }
}

// --- Global Exports ---
window.appendValue = appendValue;
window.clearDisplay = clearDisplay;
window.deleteLast = deleteLast;
window.toggleTheme = toggleTheme;
window.toggleDegRad = toggleDegRad;
window.toggleSciMode = toggleSciMode;
window.toggleGraph = toggleGraph;
window.calculate = calculate;
window.drawGraph = drawGraph;
