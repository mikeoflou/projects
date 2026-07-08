const STORAGE_KEY = "mikesTodoPage.v1";

if (new URLSearchParams(window.location.search).get("embed") === "1") {
    document.documentElement.classList.add("embedded");
}

const state = loadState();
const todoRows = document.querySelector("#todoRows");
const todoForm = document.querySelector("#todoForm");
const todoText = document.querySelector("#todoText");
const todoDate = document.querySelector("#todoDate");
let editingTodoId = null;

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
        if (editingTodoId === todo.id) {
            todoRows.appendChild(editTodoRow(todo));
            continue;
        }

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
        tr.children[3].appendChild(rowActions([
            actionButton("Edit", "edit", () => {
                editingTodoId = todo.id;
                renderTodos();
            }),
            deleteButton(todo.id),
        ]));
        todoRows.appendChild(tr);
    }
}

function editTodoRow(todo) {
    const tr = document.createElement("tr");
    tr.className = "is-editing";

    const textCell = document.createElement("td");
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.className = "row-input";
    textInput.value = todo.text;
    textInput.setAttribute("aria-label", "Edit task");
    textCell.appendChild(textInput);

    const dateCell = document.createElement("td");
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.className = "row-input";
    dateInput.value = todo.date || "";
    dateInput.setAttribute("aria-label", "Edit task date");
    dateCell.appendChild(dateInput);

    const doneCell = document.createElement("td");
    const doneWrapper = document.createElement("span");
    doneWrapper.className = "check-form";
    const doneInput = document.createElement("input");
    doneInput.type = "checkbox";
    doneInput.checked = todo.done;
    doneInput.setAttribute("aria-label", "Edit done status");
    doneWrapper.appendChild(doneInput);
    doneCell.appendChild(doneWrapper);

    const actionCell = document.createElement("td");
    actionCell.appendChild(rowActions([
        actionButton("Save", "save-edit", () => {
            const text = textInput.value.trim();
            if (!text) {
                textInput.focus();
                return;
            }

            todo.text = text;
            todo.date = dateInput.value || null;
            todo.done = doneInput.checked;
            editingTodoId = null;
            saveState();
            renderTodos();
        }),
        actionButton("Cancel", "cancel-edit", () => {
            editingTodoId = null;
            renderTodos();
        }),
    ]));

    tr.append(textCell, dateCell, doneCell, actionCell);
    setTimeout(() => textInput.focus(), 0);
    return tr;
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

function rowActions(buttons) {
    const wrapper = document.createElement("div");
    wrapper.className = "row-actions";
    for (const button of buttons) {
        wrapper.appendChild(button);
    }
    return wrapper;
}

function actionButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
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
