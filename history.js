function loadHistory() {
  let historyList = document.getElementById("historyList");
  let history = JSON.parse(localStorage.getItem("calcHistory")) || [];

  let theme = localStorage.getItem("theme");
  if (theme === "light") document.body.classList.add("light-mode");

  if (history.length === 0) {
    historyList.innerHTML = "<li>No history yet.</li>";
  } else {
    historyList.innerHTML = history.map(
      h => `<li><b>${h.expression}</b> = ${h.result}<br><small>${h.time}</small></li>`
    ).join("");
  }
}

function clearHistory() {
  localStorage.removeItem("calcHistory");
  loadHistory();
}

function goBack() {
  window.location.href = "index.html";
}

window.onload = loadHistory;

