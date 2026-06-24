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

  // Add this inside your DOMContentLoaded function
const todoBtn = document.getElementById('todoToggle');

if (todoBtn) {
    todoBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents the sidebar/menu logic from interfering
        const taskType = prompt("Enter type (Medicine or Store):");
        const taskDetails = prompt("Enter the item name or note:");
        
        if (taskType && taskDetails) {
            saveTask(taskType, taskDetails);
        }
    });
} else {
    console.error("To-Do button not found in the DOM!");
}

    async function saveTask(type, details) {
        const today = new Date().toISOString().split('T')[0];
        const { error } = await mySupabase.from('events').insert([{
            title: `[${type}] ${details}`,
            start_date: today,
            Description: 'Daily Task'
        }]);

        if (error) {
            console.error("Error saving task:", error);
            alert("Failed to save task.");
        } else {
            alert("Task added to your calendar!");
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



