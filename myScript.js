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

    document.getElementById('medicineClose')?.addEventListener('click', closeMedicineTracker);
    const medicineTrackerBody = document.getElementById('medicineTrackerBody');
    if (medicineTrackerBody && !medicineTrackerBody.dataset.tableTrackerBound) {
        medicineTrackerBody.dataset.tableTrackerBound = 'true';
        medicineTrackerBody.addEventListener('change', updateMedicineTracker);
    }
    window.__medicineTableTrackerScript = true;

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
function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function fromDateKey(dateKey) {
    const parts = dateKey.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function addDays(dateKey, days) {
    const date = fromDateKey(dateKey);
    date.setDate(date.getDate() + days);
    return toDateKey(date);
}

function formatMedicineDate(dateKey) {
    const date = fromDateKey(dateKey);
    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function defaultMedicineTrackerState() {
    const currentDate = toDateKey(new Date());
    return {
        current: { date: currentDate, morning: false, evening: false },
        previous: { date: addDays(currentDate, -1), morning: false, evening: false }
    };
}

function normalizeMedicineTrackerState(state) {
    const fallback = defaultMedicineTrackerState();
    if (!state || !state.current || !state.current.date) return fallback;

    return {
        current: {
            date: state.current.date,
            morning: Boolean(state.current.morning),
            evening: Boolean(state.current.evening)
        },
        previous: {
            date: state.previous?.date || addDays(state.current.date, -1),
            morning: Boolean(state.previous?.morning),
            evening: Boolean(state.previous?.evening)
        }
    };
}

function getMedicineTrackerState() {
    try {
        return normalizeMedicineTrackerState(JSON.parse(localStorage.getItem('medicineTrackerTableV1') || 'null'));
    } catch (error) {
        return defaultMedicineTrackerState();
    }
}

function saveMedicineTrackerState(state) {
    localStorage.setItem('medicineTrackerTableV1', JSON.stringify(normalizeMedicineTrackerState(state)));
}

function renderMedicineTracker() {
    const body = document.getElementById('medicineTrackerBody');
    if (!body) return;

    const state = getMedicineTrackerState();
    const rows = [
        { key: 'current', label: 'Current', data: state.current },
        { key: 'previous', label: 'Previous', data: state.previous }
    ];

    body.innerHTML = rows.map((row) => {
        const morningChecked = row.data.morning ? ' checked' : '';
        const eveningChecked = row.data.evening ? ' checked' : '';
        return '<tr data-med-row="' + row.key + '">' +
            '<td style="border-bottom:1px solid #eee; padding:10px; text-align:left;">' +
                '<strong>' + row.label + '</strong><br>' +
                '<span>' + formatMedicineDate(row.data.date) + '</span>' +
            '</td>' +
            '<td style="border-bottom:1px solid #eee; padding:10px;">' +
                '<input type="checkbox" data-dose="morning"' + morningChecked + ' aria-label="' + row.label + ' morning medicine">' +
            '</td>' +
            '<td style="border-bottom:1px solid #eee; padding:10px;">' +
                '<input type="checkbox" data-dose="evening"' + eveningChecked + ' aria-label="' + row.label + ' evening medicine">' +
            '</td>' +
        '</tr>';
    }).join('');
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

function updateMedicineTracker(event) {
    const checkbox = event.target.closest('input[type="checkbox"][data-dose]');
    const row = event.target.closest('[data-med-row]');
    if (!checkbox || !row) return;

    const state = getMedicineTrackerState();
    const rowKey = row.dataset.medRow;
    const dose = checkbox.dataset.dose;

    if (!state[rowKey]) return;

    state[rowKey][dose] = checkbox.checked;

    if (rowKey === 'current' && dose === 'evening' && checkbox.checked) {
        state.previous = {
            date: state.current.date,
            morning: Boolean(state.current.morning),
            evening: true
        };
        state.current = {
            date: addDays(state.previous.date, 1),
            morning: false,
            evening: false
        };
    }

    saveMedicineTrackerState(state);
    renderMedicineTracker();
}
