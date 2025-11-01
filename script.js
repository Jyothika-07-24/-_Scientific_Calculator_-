let display = document.getElementById('display');
let historyList = document.getElementById('history-list');
let isDegree = true;
let memory = 0;

// Append numbers and operators
function appendValue(val) {
    display.value += val;
}

function appendOperator(op) {
    display.value += op;
}

function appendFunc(func) {
    display.value += func;
}

// Clear and backspace
function clearDisplay() {
    display.value = '';
}

function backspace() {
    display.value = display.value.slice(0, -1);
}

// Degree/Radian toggle
function toggleDegRad() {
    isDegree = !isDegree;
    document.querySelector('button[onclick="toggleDegRad()"]').innerText = isDegree ? 'DEG' : 'RAD';
}

// Calculate expression
function calculate() {
    try {
        let expression = display.value.replace(/sin|cos|tan|log|sqrt/g, match => {
            return {
                'sin': isDegree ? 'Math.sin(Math.PI/180*' : 'Math.sin(',
                'cos': isDegree ? 'Math.cos(Math.PI/180*' : 'Math.cos(',
                'tan': isDegree ? 'Math.tan(Math.PI/180*' : 'Math.tan(',
                'log': 'Math.log10(',
                'sqrt': 'Math.sqrt('
            }[match];
        });

        let result = eval(expression);
        if (!isFinite(result)) throw 'Math Error';

        addToHistory(display.value + ' = ' + result);
        display.value = result;
    } catch (e) {
        display.value = 'Error';
    }
}

// History
function addToHistory(entry) {
    let li = document.createElement('li');
    li.textContent = entry;
    historyList.prepend(li);
}

// Memory functions
function memoryAdd() {
    memory += Number(display.value) || 0;
}

function memorySubtract() {
    memory -= Number(display.value) || 0;
}

function memoryRecall() {
    display.value = memory;
}

function memoryClear() {
    memory = 0;
}

// Theme toggle
document.getElementById('theme-btn').addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if ((e.key >= '0' && e.key <= '9') || ['+', '-', '*', '/', '.', '(', ')'].includes(e.key)) {
        display.value += e.key;
    } else if (e.key === 'Enter') {
        calculate();
    } else if (e.key === 'Backspace') {
        backspace();
    } else if (e.key === 'Escape') {
        clearDisplay();
    }
});
