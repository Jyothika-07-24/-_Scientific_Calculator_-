// script.js - full features + keyboard support
let sciMode = false;
let degMode = true;
let darkTheme = localStorage.getItem("theme") !== "light";
let graphVisible = false;
let chartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  // apply saved theme
  if (!darkTheme) document.body.classList.add("light-mode");
  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) themeBtn.innerText = darkTheme ? "🌙" : "☀️";

  // if display is focusable in some versions (readonly), ensure key events still work
  // attach keyboard listener
  window.addEventListener("keydown", handleKey);
});

// --- Utility UI functions (used by buttons and keyboard) ---
function appendValue(val) {
  const d = document.getElementById("display");
  if (!d) return;
  d.value = (d.value || "") + val;
}

function clearDisplay() {
  const d = document.getElementById("display");
  if (!d) return;
  d.value = "";
}

function deleteLast() {
  const d = document.getElementById("display");
  if (!d) return;
  d.value = d.value.slice(0, -1);
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
  // if display currently numeric, reformat immediately
  const d = document.getElementById("display");
  if (d && d.value.trim() !== "" && !isNaN(Number(d.value))) {
    d.value = sciMode ? Number(d.value).toExponential(5) : String(Number(d.value));
  }
}

function toggleGraph() {
  graphVisible = !graphVisible;
  const canvas = document.getElementById("graphCanvas");
  if (canvas) canvas.style.display = graphVisible ? "block" : "none";
  if (!graphVisible && chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

function openHistory() {
  window.location.href = "history.html";
}

// --- Calculation & parsing (keeps previous behavior) ---
function calculate() {
  try {
    const d = document.getElementById("display");
    if (!d) return;
    let expr = d.value;

    // basic replacements & support
    expr = expr.replace(/π|pi/g, "Math.PI")
               .replace(/\be\b/g, "Math.E")
               .replace(/√\(/g, "Math.sqrt(")
               .replace(/∛\(/g, "Math.cbrt(")
               .replace(/\^/g, "**")
               .replace(/\s+/g, "");

    // percent like 50% -> (50/100)
    expr = expr.replace(/(\d+(\.\d+)?)%/g, "($1/100)");

    // iterative safe replacement for nested sin/cos/tan/log/sqrt
    function replaceInnermost(fnName, replacementFn) {
      const regex = new RegExp(fnName + "\\(([^()]+)\\)");
      let loops = 0;
      while (regex.test(expr) && loops < 1000) {
        expr = expr.replace(regex, (m, inner) => replacementFn(inner));
        loops++;
      }
    }

    // apply trig with degree conversion if needed
    if (degMode) {
      replaceInnermost("sin", inner => `Math.sin((${inner})*Math.PI/180)`);
      replaceInnermost("cos", inner => `Math.cos((${inner})*Math.PI/180)`);
      replaceInnermost("tan", inner => `Math.tan((${inner})*Math.PI/180)`);
    } else {
      replaceInnermost("sin", inner => `Math.sin((${inner}))`);
      replaceInnermost("cos", inner => `Math.cos((${inner}))`);
      replaceInnermost("tan", inner => `Math.tan((${inner}))`);
    }

    // log -> Math.log10
    replaceInnermost("log", inner => `Math.log10((${inner}))`);
    // sqrt/cbrt replaced earlier via direct token; ensure if user typed sqrt(x)
    replaceInnermost("sqrt", inner => `Math.sqrt((${inner}))`);
    replaceInnermost("cbrt", inner => `Math.cbrt((${inner}))`);

    // factorial like 5! -> computed
    expr = expr.replace(/(\d+(\.\d+)?)!/g, (m, n) => {
      const val = Number(n);
      return Number.isFinite(val) && val >= 0 && Math.floor(val) === val ? factorial(val) : "NaN";
    });

    // evaluate safely via Function
    const resultRaw = Function('"use strict"; return (' + expr + ')')();

    if (!isFinite(resultRaw)) throw new Error("Math error");

    const result = sciMode ? Number(resultRaw).toExponential(6) : Number(resultRaw);
    d.value = result;

    // save to history
    saveToHistory(expr, result);
  } catch (err) {
    console.error(err);
    const d = document.getElementById("display");
    if (d) d.value = "Error";
  }
}

// factorial helper used only by replacement (small integers)
function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// save history: simple object list {expression, result, time}
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

// draw graph (basic). Requires Chart.js script included on the page.
function drawGraph(exprOriginal) {
  try {
    const canvas = document.getElementById("graphCanvas");
    if (!canvas) return;
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");

    const xs = [];
    const ys = [];
    for (let x = -10; x <= 10; x += 0.25) {
      let e = exprOriginal.replace(/π|pi/g, "Math.PI").replace(/\be\b/g, "Math.E").replace(/\^/g, "**");
      // replace x with numeric
      e = e.replace(/x/g, `(${x})`);
      // handle trig as in calculate (deg/rad)
      if (degMode) {
        e = e.replace(/sin\(([^)]+)\)/g, (m,a)=>`Math.sin((${a})*Math.PI/180)`);
        e = e.replace(/cos\(([^)]+)\)/g, (m,a)=>`Math.cos((${a})*Math.PI/180)`);
        e = e.replace(/tan\(([^)]+)\)/g, (m,a)=>`Math.tan((${a})*Math.PI/180)`);
      } else {
        e = e.replace(/sin\(([^)]+)\)/g, (m,a)=>`Math.sin((${a}))`);
        e = e.replace(/cos\(([^)]+)\)/g, (m,a)=>`Math.cos((${a}))`);
        e = e.replace(/tan\(([^)]+)\)/g, (m,a)=>`Math.tan((${a}))`);
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
      data: { labels: xs, datasets: [{ label: exprOriginal, data: ys, borderColor: "#00ffcc", tension: 0.2 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: "x" } }, y: { title: { display: true, text: "f(x)" } } } }
    });
  } catch (e) {
    console.error("drawGraph error", e);
  }
}

// --- Keyboard handling ---
// Map single-letter keys to functions or values for convenience
const keyMap = {
  // letters -> insert function
  s: "sin(", S: "sin(",
  c: "cos(", C: "cos(",
  t: "tan(", T: "tan(",
  l: "log(", L: "log(",
  r: "sqrt(", R: "sqrt(", // r for root
  p: "pi", P: "pi",
  e: "e", E: "e",
  // convenience toggles
  g: "TOGGLE_GRAPH", // graph
  i: "TOGGLE_SCI"    // sci
};

function handleKey(e) {
  // ignore if user is typing in an unrelated input (rare because display is readonly)
  const tag = (document.activeElement && document.activeElement.tagName) || "";
  if (tag === "INPUT" || tag === "TEXTAREA") {
    // but allow Enter in case focus is on display
    if (e.key === "Enter") { e.preventDefault(); calculate(); }
    return;
  }

  // allow common shortcuts: Ctrl/Cmd+C (copy) etc. Don't intercept Ctrl/Meta combos
  if (e.ctrlKey || e.metaKey) return;

  const key = e.key;

  // Enter -> calculate
  if (key === "Enter") { e.preventDefault(); calculate(); return; }
  // Backspace -> delete
  if (key === "Backspace") { e.preventDefault(); deleteLast(); return; }
  // Escape -> clear
  if (key === "Escape") { e.preventDefault(); clearDisplay(); return; }
  // Graph toggle (g)
  if (key === "g" || key === "G") { e.preventDefault(); toggleGraph(); return; }
  // SCI toggle (i)
  if (key === "i" || key === "I") { e.preventDefault(); toggleSciMode(); return; }

  // digits & operators allowed
  const allowed = "0123456789.+-*/^()%,"; // include comma and percent and parentheses
  if (allowed.includes(key)) {
    e.preventDefault();
    appendValue(key);
    return;
  }

  // map letters to functions/values if defined
  if (keyMap[key]) {
    e.preventDefault();
    const val = keyMap[key];
    if (val === "TOGGLE_GRAPH") toggleGraph();
    else if (val === "TOGGLE_SCI") toggleSciMode();
    else appendValue(val);
    return;
  }
  // otherwise ignore the key
}

// --- Keyboard paste support: allow pasting math expression via Ctrl+V into display -->
window.addEventListener("paste", (ev) => {
  ev.preventDefault();
  const text = (ev.clipboardData || window.clipboardData).getData("text");
  // basic sanitize: only allow digits, operators, letters used in functions, parentheses, comma, spaces
  const sanitized = text.replace(/[^0-9+\-*/^().,%a-zA-Zππ ]/g, "");
  appendValue(sanitized);
});

// --- Expose some functions to HTML buttons if needed globally ---
window.appendValue = appendValue;
window.clearDisplay = clearDisplay;
window.deleteLast = deleteLast;
window.toggleTheme = toggleTheme;
window.toggleDegRad = toggleDegRad;
window.toggleSciMode = toggleSciMode;
window.toggleGraph = toggleGraph;
window.calculate = calculate;
window.openHistory = openHistory;
window.drawGraph = drawGraph;




