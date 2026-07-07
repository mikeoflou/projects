const STORAGE_KEY = "mikesTodoPage.v1";

if (new URLSearchParams(window.location.search).get("embed") === "1") {
    document.documentElement.classList.add("embedded");
}

const state = loadState();
const medicineRows = document.querySelector("#medicineRows");
const todoRows = document.querySelector("#todoRows");
const todoForm = document.querySelector("#todoForm");
const todoText = document.querySelector("#todoText");
const todoDate = document.querySelector("#todoDate");

function loadState() {
    const fallback = { todos: [], medicine: {} };

    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return {
            todos: Array.isArray(saved?.todos) ? saved.todos : [],
            medicine: saved?.medicine && typeof saved.medicine === "object" ? saved.medicine : {},
        };
    } catch {
        return fallback;
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function dateFromKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function displayDate(key) {
    return dateFromKey(key).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function medicineEntry(key) {
    state.medicine[key] = state.medicine[key] || { morning: false, evening: false };
    return state.medicine[key];
}

function medicineTrackerRows() {
    let current = new Date();

    for (let index = 0; index < 730; index += 1) {
        const entry = medicineEntry(dateKey(current));
        if (!entry.evening) {
            break;
        }
        current = addDays(current, 1);
    }

    return [
        { label: "Current", key: dateKey(current) },
        { label: "Previous", key: dateKey(addDays(current, -1)) },
    ];
}

function renderMedicine() {
    medicineRows.replaceChildren();

    for (const row of medicineTrackerRows()) {
        const entry = medicineEntry(row.key);
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                <strong>${row.label}</strong>
                <span>${displayDate(row.key)}</span>
            </td>
            <td></td>
            <td></td>
        `;

        tr.children[1].appendChild(medicineCheckbox(row.key, "morning", entry.morning, `${row.label} morning medicine`));
        tr.children[2].appendChild(medicineCheckbox(row.key, "evening", entry.evening, `${row.label} evening medicine`));
        medicineRows.appendChild(tr);
    }
}

function medicineCheckbox(key, dose, checked, label) {
    const wrapper = document.createElement("span");
    wrapper.className = "check-form";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    checkbox.setAttribute("aria-label", label);
    checkbox.addEventListener("change", () => {
        medicineEntry(key)[dose] = checkbox.checked;
        saveState();
        renderMedicine();
    });

    wrapper.appendChild(checkbox);
    return wrapper;
}

function renderTodos() {
    todoRows.replaceChildren();

    const todos = [...state.todos].sort((left, right) => {
        if (!left.date && right.date) return 1;
        if (left.date && !right.date) return -1;
        if (left.date !== right.date) return String(left.date).localeCompare(String(right.date));
        return right.id - left.id;
    });

    if (todos.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = '<td colspan="4" class="empty-row">No tasks</td>';
        todoRows.appendChild(emptyRow);
        return;
    }

    for (const todo of todos) {
        const tr = document.createElement("tr");
        if (todo.done) {
            tr.className = "is-done";
        }

        tr.innerHTML = `
            <td></td>
            <td>${todo.date || "-"}</td>
            <td></td>
            <td></td>
        `;

        tr.children[0].textContent = todo.text;
        tr.children[2].appendChild(todoCheckbox(todo));
        tr.children[3].appendChild(deleteButton(todo.id));
        todoRows.appendChild(tr);
    }
}

function todoCheckbox(todo) {
    const wrapper = document.createElement("span");
    wrapper.className = "check-form";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", `Mark ${todo.text} done`);
    checkbox.addEventListener("change", () => {
        todo.done = checkbox.checked;
        saveState();
        renderTodos();
    });

    wrapper.appendChild(checkbox);
    return wrapper;
}

function deleteButton(id) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "delete";
    button.textContent = "Delete";
    button.addEventListener("click", () => {
        state.todos = state.todos.filter((todo) => todo.id !== id);
        saveState();
        renderTodos();
    });

    return button;
}

todoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = todoText.value.trim();
    if (!text) {
        return;
    }

    state.todos.push({
        id: Date.now(),
        text,
        date: todoDate.value || null,
        done: false,
    });

    todoText.value = "";
    todoDate.value = "";
    saveState();
    renderTodos();
});

renderMedicine();
renderTodos();
