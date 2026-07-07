const STORAGE_KEY = "mikesTodoPage.v1";

if (new URLSearchParams(window.location.search).get("embed") === "1") {
    document.documentElement.classList.add("embedded");
}

const state = loadState();
const todoRows = document.querySelector("#todoRows");
const todoForm = document.querySelector("#todoForm");
const todoText = document.querySelector("#todoText");
const todoDate = document.querySelector("#todoDate");

function loadState() {
    const fallback = { todos: [] };

    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return {
            todos: Array.isArray(saved?.todos) ? saved.todos : [],
        };
    } catch {
        return fallback;
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

renderTodos();
