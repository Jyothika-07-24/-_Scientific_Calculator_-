const display = document.getElementById("display");
const buttons = document.querySelectorAll("button");
const degToggle = document.getElementById("deg-toggle");
const sciToggle = document.getElementById("sci-toggle");
const themeToggle = document.getElementById("theme-toggle");
const historyBtn = document.getElementById("history-btn");
const historyPage = document.getElementById("history-page");
const clearHistoryBtn = document.getElementById("clear-history");
const backBtn = document.getElementById("back-btn");
const historyList = document.getElementById("history-list");

let isDegree = true;
let sciMode = false;
let history = JSON.parse(localStorage.getItem("calcHistory")) || [];

function updateDisplay(value) {
  display.value += value;
}

function calculate() {
  try {
    let expr = display.value
      .replace(/÷/g, "/")
      .replace(/×/g, "*")
      .replace(/π/g, "Math.PI")
      .replace(/e/g, "Math.E")
      .replace(/√/g, "Math.sqrt")
      .replace(/∛/g, "Math.cbrt")
      .replace(/log/g, "Math.log10")
      .replace(/sin/g, "Math.sin")
      .replace(/cos/g, "Math.cos")
      .replace(/tan/g, "Math.tan")
      .replace(/\^/g, "**")
      .replace(/!/g, (match, offset, string) => {
        const num = parseFloat(string.slice(0, offset).match(/(\d+)(?!.*\d)/)[0]);
        return factorial(num);
      });

    if (isDegree) expr = expr.replace(/Math\.sin\(([^)]*)\)/g, (_, a) => `Math.sin((${a}) * Math.PI / 180)`)
                            .replace(/Math\.cos\(([^)]*)\)/g, (_, a) => `Math.cos((${a}) * Math.PI / 180)`)
                            .replace(/Math\.tan\(([^)]*)\)/g, (_, a) => `Math.tan((${a}) * Math.PI / 180)`);

    let result = eval(expr);

    if (sciMode) result = result.toExponential(6);
    display.value = result;
    history.push(`${display.value} = ${result}`);
    localStorage.setItem("calcHistory", JSON.stringify(history));
    updateHistoryList();

  } catch (e) {
    display.value = "Error";
  }
}

function factorial(n) {
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

function updateHistoryList() {
  historyList.innerHTML = "";
  history.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    historyList.appendChild(li);
  });
}

// Button actions
buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const val = btn.textContent;
    if (val === "=") calculate();
    else if (val === "C") display.value = "";
    else if (val === "⌫") display.value = display.value.slice(0, -1);
    else if (val === "DEG") {
      isDegree = !isDegree;
      degToggle.textContent = isDegree ? "DEG" : "RAD";
    } else if (val === "SCI OFF" || val === "SCI ON") {
      sciMode = !sciMode;
      sciToggle.textContent = sciMode ? "SCI ON" : "SCI OFF";
    } else if (!btn.id) {
      updateDisplay(val);
    }
  });
});

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", document.body.classList.contains("dark-mode"));
});

// Load saved theme
if (localStorage.getItem("theme") === "true") {
  document.body.classList.add("dark-mode");
}

// History view
historyBtn.addEventListener("click", () => {
  document.querySelector(".calculator").classList.add("hidden");
  historyPage.classList.remove("hidden");
});

backBtn.addEventListener("click", () => {
  historyPage.classList.add("hidden");
  document.querySelector(".calculator").classList.remove("hidden");
});

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  localStorage.removeItem("calcHistory");
  updateHistoryList();
});

updateHistoryList();


