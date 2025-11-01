let display = document.getElementById("display");
let mode = "DEG";
let sciMode = false;
let chart;
let history = JSON.parse(localStorage.getItem("calcHistory")) || [];

// Append symbol to display
function appendSymbol(symbol) {
  display.value += symbol;
}

// Clear all
function clearDisplay() {
  display.value = "";
}

// Delete last
function deleteLast() {
  display.value = display.value.slice(0, -1);
}

// Toggle DEG/RAD
function toggleDegRad() {
  mode = mode === "DEG" ? "RAD" : "DEG";
  document.getElementById("modeBtn").innerText = mode;
}

// Toggle SCI mode
function toggleSci() {
  sciMode = !sciMode;
  document.getElementById("sciBtn").innerText = sciMode ? "SCI ON" : "SCI OFF";
}

// Calculate expression
function calculate() {
  try {
    let expr = formatExpression(display.value);
    let result = eval(expr);
    if (sciMode) result = result.toExponential(6);

    history.push(`${display.value} = ${result}`);
    localStorage.setItem("calcHistory", JSON.stringify(history));

    display.value = result;
  } catch {
    alert("Invalid Expression");
  }
}

// Format for JS
function formatExpression(expr) {
  return expr
    .replace(/÷/g, "/")
    .replace(/×/g, "*")
    .replace(/π/g, "Math.PI")
    .replace(/e/g, "Math.E")
    .replace(/√\(/g, "Math.sqrt(")
    .replace(/∛\(/g, "Math.cbrt(")
    .replace(/sin\(/g, `Math.sin(${mode === "DEG" ? "Math.PI/180*" : ""}`)
    .replace(/cos\(/g, `Math.cos(${mode === "DEG" ? "Math.PI/180*" : ""}`)
    .replace(/tan\(/g, `Math.tan(${mode === "DEG" ? "Math.PI/180*" : ""}`)
    .replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)))
    .replace(/%/g, "/100")
    .replace(/\^/g, "**");
}

// Factorial
function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0) return 1;
  return n * factorial(n - 1);
}

// Plot graph
function plotGraph() {
  const expr = display.value.trim();
  if (!expr.includes("x")) {
    alert("Please include 'x' (e.g., sin(x) or x^2)");
    return;
  }

  document.querySelector(".buttons").classList.add("hidden");
  document.querySelector(".controls").classList.add("hidden");
  document.getElementById("graphContainer").classList.remove("hidden");

  const ctx = document.getElementById("graphCanvas").getContext("2d");
  const xValues = [];
  const yValues = [];

  for (let x = -10; x <= 10; x += 0.1) {
    try {
      let safeExpr = formatExpression(expr).replace(/\bx\b/g, `(${x})`);
      let y = eval(safeExpr);
      if (isFinite(y)) {
        xValues.push(x.toFixed(2));
        yValues.push(y);
      }
    } catch {}
  }

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: xValues,
      datasets: [{
        label: `y = ${expr}`,
        data: yValues,
        borderColor: "#00ffcc",
        borderWidth: 2,
        pointRadius: 0,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "x" } },
        y: { title: { display: true, text: "y" } },
      },
    },
  });
}

// History
document.getElementById("historyBtn").addEventListener("click", () => {
  document.querySelector(".buttons").classList.add("hidden");
  document.querySelector(".controls").classList.add("hidden");
  document.getElementById("historyContainer").classList.remove("hidden");
  loadHistory();
});

function loadHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  history.slice(-10).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function clearHistory() {
  history = [];
  localStorage.removeItem("calcHistory");
  loadHistory();
}

// Back button
function backToCalc() {
  document.querySelector(".buttons").classList.remove("hidden");
  document.querySelector(".controls").classList.remove("hidden");
  document.getElementById("graphContainer").classList.add("hidden");
  document.getElementById("historyContainer").classList.add("hidden");
}

// Theme toggle
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
});



