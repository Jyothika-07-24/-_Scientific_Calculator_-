let sciMode = false;
let degMode = true;
let darkTheme = localStorage.getItem("theme") !== "light";

document.addEventListener("DOMContentLoaded", () => {
  if (!darkTheme) document.body.classList.add("light-mode");
  document.getElementById("themeBtn").innerText = darkTheme ? "🌙" : "☀️";
});

function appendValue(value) {
  document.getElementById("display").value += value;
}

function clearDisplay() {
  document.getElementById("display").value = "";
}

function deleteLast() {
  let display = document.getElementById("display");
  display.value = display.value.slice(0, -1);
}

function toggleDegRad() {
  degMode = !degMode;
  document.getElementById("modeBtn").innerText = degMode ? "DEG" : "RAD";
}

function toggleTheme() {
  darkTheme = !darkTheme;
  document.body.classList.toggle("light-mode", !darkTheme);
  localStorage.setItem("theme", darkTheme ? "dark" : "light");
  let themeBtn = document.getElementById("themeBtn");
  themeBtn.innerText = darkTheme ? "🌙" : "☀️";
  themeBtn.classList.add("glow");
  setTimeout(() => themeBtn.classList.remove("glow"), 600);
}

function toggleSciMode() {
  sciMode = !sciMode;
  let btn = document.getElementById("sciBtn");
  btn.innerText = sciMode ? "SCI ON" : "SCI OFF";
  btn.classList.add("glow");
  setTimeout(() => btn.classList.remove("glow"), 600);
}

function calculate() {
  try {
    let expr = document.getElementById("display").value;

    // Replace math functions
    expr = expr.replace(/sin\(/g, "Math.sin(");
    expr = expr.replace(/cos\(/g, "Math.cos(");
    expr = expr.replace(/tan\(/g, "Math.tan(");
    expr = expr.replace(/log\(/g, "Math.log10(");
    expr = expr.replace(/sqrt\(/g, "Math.sqrt(");

    // Degree conversion
    if (degMode) {
      expr = expr.replace(/Math\.sin\(([^)]+)\)/g, "Math.sin(($1)*Math.PI/180)");
      expr = expr.replace(/Math\.cos\(([^)]+)\)/g, "Math.cos(($1)*Math.PI/180)");
      expr = expr.replace(/Math\.tan\(([^)]+)\)/g, "Math.tan(($1)*Math.PI/180)");
    }

    let result = eval(expr);

    // Handle SCI mode
    if (sciMode) result = Number(result).toExponential(5);

    document.getElementById("display").value = result;
    saveToHistory(expr, result);
  } catch {
    document.getElementById("display").value = "Error";
  }
}

function saveToHistory(expression, result) {
  let history = JSON.parse(localStorage.getItem("calcHistory")) || [];
  history.push({ expression, result, time: new Date().toLocaleString() });
  localStorage.setItem("calcHistory", JSON.stringify(history));
}

function openHistory() {
  window.location.href = "history.html";
}



