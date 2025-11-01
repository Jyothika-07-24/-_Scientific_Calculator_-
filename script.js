let display = document.getElementById("display");
let mode = "DEG";
let sciMode = false;
let history = JSON.parse(localStorage.getItem("calcHistory")) || [];
let chart;

// Append symbol to display
function appendSymbol(symbol) {
  display.value += symbol;
}

// Clear display
function clearDisplay() {
  display.value = "";
}

// Delete last character
function deleteLast() {
  display.value = display.value.slice(0, -1);
}

// Toggle degree/radian mode
function toggleDegRad() {
  mode = mode === "DEG" ? "RAD" : "DEG";
  document.getElementById("modeBtn").innerText = mode;
}

// Toggle scientific notation
function toggleSci() {
  sciMode = !sciMode;
  document.getElementById("sciBtn").innerText = sciMode ? "SCI ON" : "SCI OFF";
}

// Theme toggle
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
});

// History toggle
document.getElementById("historyBtn").addEventListener("click", toggleHistory);

function toggleHistory() {
  const calc = document.querySelector(".buttons");
  const graph = document.getElementById("graphContainer");
  const historyDiv = document.getElementById("historyContainer");
  const controls = document.querySelector(".controls");

  if (historyDiv.classList.contains("hidden")) {
    historyDiv.classList.remove("hidden");
    calc.classList.add("hidden");
    controls.classList.add("hidden");
    graph.classList.add("hidden");
    loadHistory();
  }
}

function backToCalc() {
  document.getElementById("historyContainer").classList.add("hidden");
  document.querySelector(".buttons").classList.remove("hidden");
  document.querySelector(".controls").classList.remove("hidden");
  document.getElementById("graphContainer").classList.add("hidden");
}

// Calculate expression
function calculate() {
  try {
    let expression = display.value
      .replace(/÷/g, "/")
      .replace(/×/g, "*")
      .replace(/π/g, "Math.PI")
      .replace(/e/g, "Math.E")
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/∛\(/g, "Math.cbrt(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/sin\(/g, `Math.sin(${mode === "DEG" ? "Math.PI/180*" : ""}`)
      .replace(/cos\(/g, `Math.cos(${mode === "DEG" ? "Math.PI/180*" : ""}`)
      .replace(/tan\(/g, `Math.tan(${mode === "DEG" ? "Math.PI/180*" : ""}`)
      .replace(/(\d+)!/g, (_, n) => factorial(parseInt(n)))
      .replace(/%/g, "/100");

    let result = eval(expression);
    if (sciMode) result = result.toExponential(6);

    history.push(`${display.value} = ${result}`);
    localStorage.setItem("calcHistory", JSON.stringify(history));
    display.value = result;
  } catch (err) {
    alert("Invalid Expression");
  }
}

function factorial(n) {
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

// Load history
function loadHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  history.slice(-10).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

// Clear history
function clearHistory() {
  history = [];
  localStorage.removeItem("calcHistory");
  loadHistory();
}

// Plot graph
function plotGraph() {
  const expr = display.value;
  if (!expr.includes("x")) {
    alert("Please include 'x' in your expression (e.g., sin(x) or x^2)");
    return;
  }

  document.querySelector(".buttons").classList.add("hidden");
  document.querySelector(".controls").classList.add("hidden");
  document.getElementById("graphContainer").classList.remove("hidden");

  const ctx = document.getElementById("graphCanvas").getContext("2d");
  const xValues = [];
  const yValues = [];

  for (let x = -10; x <= 10; x += 0.1) {
    let safeExpr = expr
      .replace(/÷/g, "/")
      .replace(/×/g, "*")
      .replace(/π/g, "Math.PI")
      .replace(/e/g, "Math.E")
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/∛\(/g, "Math.cbrt(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/sin\(/g, `Math.sin(${mode === "DEG" ? "Math.PI/180*" : ""}`)
      .replace(/cos\(/g, `Math.cos(${mode === "DEG" ? "Math.PI/180*" : ""}`)
      .replace(/tan\(/g, `Math.tan(${mode === "DEG" ? "Math.PI/180*" : ""}`)
      .replace(/\^/g, "**");

    try {
      let y = eval(safeExpr.replace(/x/g, `(${x})`));
      if (isFinite(y)) {
        xValues.push(x);
        yValues.push(y);
      }
    } catch {}
  }

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: xValues,
      datasets: [
        {
          label: `y = ${expr}`,
          data: yValues,
          borderColor: "#00ffcc",
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
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

