const mySupabase = supabase.createClient(
  "https://hmzvjojgqaoeyenvvsor.supabase.co",
  "sb_publishable_-b3XpSFtUWN4nu_O75USFw_z2wVpRKg"
);

document.addEventListener('DOMContentLoaded', async function() {
    // --- Elements ---
    const modal = document.getElementById('eventModal');
    const calendarEl = document.getElementById('calendar');
    const calCont = document.getElementById('calendarContainer');
    const sidebar = document.getElementById('sidebar');
    const dateTimeEl = document.getElementById('date-time');
    const weatherEl = document.getElementById('weather');
    const outputField = document.getElementById('ai-output');
    
    const API_KEY = 'd1e6fb784b1050cf34f0c8f0b552db49';
    const CITY = 'Jeffersonville';

    document.querySelectorAll('.shortcut-tile').forEach((tile) => {
        tile.removeAttribute('target');
        tile.addEventListener('click', (e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            window.location.href = tile.href;
        });
    });

    document.getElementById('aiSearchForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('aiSearchInput')?.value.trim();
        if (!query) {
            if (outputField) outputField.textContent = 'Type something to search first.';
            return;
        }

        if (outputField) outputField.textContent = 'Opening AI search...';
        const searchUrl = new URL('https://www.google.com/search');
        searchUrl.searchParams.set('udm', '50');
        searchUrl.searchParams.set('q', query);
        window.location.href = searchUrl.toString();
    });

    const todoBtn = document.getElementById('todoToggle');
    todoBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskType = prompt("Enter type (Medicine or Store):");
        const taskDetails = prompt("Enter the item name or note:");

        if (taskType && taskDetails) {
            saveTask(taskType, taskDetails);
        }
    });

    // --- Clock ---
    setInterval(() => {
        if (dateTimeEl) dateTimeEl.textContent = new Date().toLocaleString();
    }, 1000);

    // --- Weather ---
    async function fetchWeather() {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=imperial&appid=${API_KEY}`);
            if (!response.ok) throw new Error('Weather fetch failed');
            const data = await response.json();
            if (weatherEl) weatherEl.textContent = `${Math.round(data.main.temp)}°F, ${data.weather[0].main}`;
        } catch (error) {
            console.error("Weather failed:", error);
            if (weatherEl) weatherEl.textContent = "Weather unavailable";
        }
    }
    fetchWeather();
    setInterval(fetchWeather, 600000);

    // --- Sidebar and Nav ---
    document.getElementById('toggleNav')?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.style.width = (sidebar.style.width === "250px") ? "0" : "250px";
    });

    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.style.width === "250px" && !sidebar.contains(e.target) && e.target.id !== 'toggleNav') {
            sidebar.style.width = "0";
        }
    });

    // --- Calendar Logic ---
    let events = [];
    try {
        let { data } = await mySupabase.from('events').select('*');
        if (data) events = data;
    } catch (err) { console.error("Error loading events:", err); }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        events: events.map(e => ({
            id: e.id, 
            title: (e.time ? e.time.substring(0, 5) + " " : "") + (e.title || ""),
            start: e.start_date,
            extendedProps: { description: e.Description, time: e.time }
        })),
        dateClick: (info) => {
            window.selectedEventId = null;
            window.selectedDate = info.dateStr;
            modal.style.display = 'block';
        },
        eventClick: (info) => {
            window.selectedEventId = info.event.id;
            document.getElementById('eventTitle').value = info.event.title.replace(/^\d{2}:\d{2}\s/, '');
            document.getElementById('eventDesc').value = info.event.extendedProps.description || '';
            modal.style.display = 'block';
        }
    });
    calendar.render();

    document.getElementById('calendarToggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        calCont.classList.toggle('hidden');
        if (!calCont.classList.contains('hidden')) calendar.updateSize();
    });

    document.getElementById('medicineToggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showMedicineTracker();
    });

    document.getElementById('medicineForm')?.addEventListener('submit', addMedicineItem);
    document.getElementById('medicineClose')?.addEventListener('click', closeMedicineTracker);
    document.getElementById('medicineList')?.addEventListener('click', updateMedicineItem);

   async function saveTask(type, details) {
    const today = new Date().toISOString().split('T')[0];
    const normalizedType = type.trim().toLowerCase();
    const updatePayload = normalizedType.startsWith('med')
        ? { medicine_task: details }
        : { grocery_task: details };

    const { error } = await mySupabase
        .from('events')
        .insert([{
            start_date: today,
            ...updatePayload
        }]);

    if (error) console.error("Error saving task:", error);
    else {
        alert("Task saved!");
        location.reload();
    }
}
  

    // --- Modal Controls ---
    window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

    document.getElementById('saveBtn')?.addEventListener('click', async () => {
        const payload = {
            title: document.getElementById('eventTitle').value,
            Description: document.getElementById('eventDesc').value,
            time: document.getElementById('eventTime').value ? document.getElementById('eventTime').value + ":00" : null
        };
        if (window.selectedEventId) {
            await mySupabase.from('events').update(payload).eq('id', window.selectedEventId);
        } else {
            await mySupabase.from('events').insert([{ ...payload, start_date: window.selectedDate }]);
        }
        location.reload();
    });

    document.getElementById('deleteBtn')?.addEventListener('click', async () => {
        if (window.selectedEventId) {
            await mySupabase.from('events').delete().eq('id', window.selectedEventId);
            location.reload();
        }
    });
});
function getMedicineItems() {
    try {
        const stored = JSON.parse(localStorage.getItem('medicineTrackerV1') || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch (error) {
        return [];
    }
}

function saveMedicineItems(items) {
    localStorage.setItem('medicineTrackerV1', JSON.stringify(items));
}

function renderMedicineTracker() {
    const list = document.getElementById('medicineList');
    if (!list) return;

    const items = getMedicineItems();
    list.innerHTML = '';

    if (!items.length) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'No medicines added yet.';
        list.appendChild(emptyMessage);
        return;
    }

    items.forEach((item) => {
        const card = document.createElement('div');
        card.style.cssText = 'border:1px solid #ddd; border-radius:8px; padding:10px; margin-top:10px; background:#fafafa;';

        const title = document.createElement('strong');
        title.textContent = item.name;
        card.appendChild(title);

        const dose = document.createElement('div');
        dose.textContent = (item.dose || 'No dose') + ' - ' + (item.time || 'No time set');
        card.appendChild(dose);

        const lastTaken = document.createElement('div');
        lastTaken.textContent = 'Last taken: ' + (item.lastTaken || 'Not marked yet');
        card.appendChild(lastTaken);

        const takenButton = document.createElement('button');
        takenButton.type = 'button';
        takenButton.dataset.medTaken = item.id;
        takenButton.textContent = 'Taken';
        takenButton.style.marginRight = '8px';
        card.appendChild(takenButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.dataset.medDelete = item.id;
        deleteButton.textContent = 'Delete';
        card.appendChild(deleteButton);

        list.appendChild(card);
    });
}

function showMedicineTracker() {
    renderMedicineTracker();
    const modal = document.getElementById('medicineTrackerModal');
    if (modal) modal.style.display = 'block';
}

function closeMedicineTracker() {
    const modal = document.getElementById('medicineTrackerModal');
    if (modal) modal.style.display = 'none';
}

function addMedicineItem(event) {
    event.preventDefault();

    const nameInput = document.getElementById('medicineName');
    const doseInput = document.getElementById('medicineDose');
    const timeInput = document.getElementById('medicineTime');
    const name = nameInput?.value.trim();

    if (!name) return;

    const items = getMedicineItems();
    items.unshift({
        id: Date.now().toString(36),
        name,
        dose: doseInput?.value.trim() || '',
        time: timeInput?.value || '',
        lastTaken: ''
    });

    saveMedicineItems(items);
    event.target.reset();
    renderMedicineTracker();
}

function updateMedicineItem(event) {
    const takenButton = event.target.closest('[data-med-taken]');
    const deleteButton = event.target.closest('[data-med-delete]');

    if (!takenButton && !deleteButton) return;

    let items = getMedicineItems();

    if (takenButton) {
        const item = items.find((medicine) => medicine.id === takenButton.dataset.medTaken);
        if (item) item.lastTaken = new Date().toLocaleString();
    }

    if (deleteButton) {
        items = items.filter((medicine) => medicine.id !== deleteButton.dataset.medDelete);
    }

    saveMedicineItems(items);
    renderMedicineTracker();
}
