let display = document.getElementById("display");
let graphCanvas = document.getElementById("graphCanvas");
let clickSound = document.getElementById("clickSound");
let isDegree = true;
let isScientific = false;

// Sound feedback
document.querySelectorAll(".btn").forEach(btn => {
  btn.addEventListener("click", () => clickSound.play());
});

function appendValue(val) { display.value += val; }
function appendOperator(op) { display.value += op; }
function appendFunc(fn) { display.value += fn; }

function clearDisplay() { display.value = ""; }
function backspace() { display.value = display.value.slice(0, -1); }

function toggleDegRad() {
  isDegree = !isDegree;
  event.target.innerText = isDegree ? "DEG" : "RAD";
}

function toggleSci() {
  isScientific = !isScientific;
  alert("Scientific mode: " + (isScientific ? "ON" : "OFF"));
}

function factorial(n) {
  if (n < 0) return NaN;
  return n === 0 ? 1 : n * factorial(n - 1);
}

function calculate() {
  try {
    let expr = display.value.replace(/sin|cos|tan|log|sqrt|factorial|cbrt/g, match => ({
      sin: isDegree ? "Math.sin(Math.PI/180*" : "Math.sin(",
      cos: isDegree ? "Math.cos(Math.PI/180*" : "Math.cos(",
      tan: isDegree ? "Math.tan(Math.PI/180*" : "Math.tan(",
      log: "Math.log10(",
      sqrt: "Math.sqrt(",
      cbrt: "Math.cbrt(",
      factorial: "factorial("
    }[match]));

    let result = eval(expr);
    if (isScientific) result = result.toExponential(4);
    if (!isFinite(result)) throw "Error";

    saveToHistory(display.value + " = " + result);
    display.value = result;
  } catch {
    display.value = "Error";
  }
}

// Theme system
const themeBtn = document.getElementById("theme-btn");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

// History
function saveToHistory(entry) {
  let history = JSON.parse(localStorage.getItem("calcHistory")) || [];
  history.unshift(entry);
  localStorage.setItem("calcHistory", JSON.stringify(history));
}

function openHistory() {
  window.location.href = "history.html";
}

// Graph Plot
function plotGraph() {
  const expr = display.value;
  const ctx = graphCanvas.getContext("2d");
  const chartData = [];
  for (let x = -10; x <= 10; x += 0.1) {
    try {
      let y = eval(expr.replace(/x/g, x));
      chartData.push({ x, y });
    } catch {}
  }
  graphCanvas.style.display = "block";
  new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: expr,
        data: chartData,
        borderWidth: 2,
        borderColor: "orange",
        showLine: true,
        parsing: { xAxisKey: "x", yAxisKey: "y" }
      }]
    },
    options: {
      scales: { x: { type: "linear" } },
      plugins: { legend: { display: false } }
    }
  });
}

