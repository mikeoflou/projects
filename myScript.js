const mySupabase = supabase.createClient(
    'https://saufbyduwfoipmcztzde.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdWZieWR1d2ZvaXBtY3p0emRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NjM1MDgsImV4cCI6MjA5NzUzOTUwOH0.4pPYL-bCvKgpkQXPfqakUJjqo3LUeieHXCS1tBPET3s' // Paste the key you just copied here
);

document.addEventListener('DOMContentLoaded', async function() {
    const modal = document.getElementById('eventModal');
    const calendarEl = document.getElementById('calendar');
    const calCont = document.getElementById('calendarContainer');
    const sidebar = document.getElementById('sidebar');
    
    const dateTimeEl = document.getElementById('date-time');
    const weatherEl = document.getElementById('weather');
    const API_KEY = 'd1e6fb784b1050cf34f0c8f0b552db49';
    const CITY = 'Jeffersonville';

    setInterval(() => {
        dateTimeEl.textContent = new Date().toLocaleString();
    }, 1000);

    async function fetchWeather() {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=imperial&appid=${API_KEY}`);
            if (!response.ok) throw new Error('Weather fetch failed');
            const data = await response.json();
            weatherEl.textContent = `${Math.round(data.main.temp)}°F, ${data.weather[0].main}`;
        } catch (error) {
            console.error("Weather failed:", error);
            weatherEl.textContent = "Weather unavailable";
        }
    }
    fetchWeather();
    setInterval(fetchWeather, 600000);

    document.getElementById('toggleNav').addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.style.width = (sidebar.style.width === "250px") ? "0" : "250px";
    });

    document.addEventListener('click', (e) => {
        if (sidebar.style.width === "250px" && !sidebar.contains(e.target) && e.target.id !== 'toggleNav') {
            sidebar.style.width = "0";
        }
    });

    let events = [];
    try {
        let { data } = await mySupabase.from('events').select('*');
        if (data) events = data;
    } catch (err) {
        console.error("Error loading Supabase events:", err);
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        displayEventTime: false,
        events: events.map(e => ({
            id: e.id, 
            title: (e.time ? e.time.substring(0, 5) + " " : "") + (e.title || ""),
            start: e.start_date,
            extendedProps: { description: e.Description, time: e.time }
        })),
        dateClick: (info) => {
            window.selectedEventId = null;
            window.selectedDate = info.dateStr;
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventDesc').value = '';
            document.getElementById('eventTime').value = '';
            modal.style.display = 'block';
        },
        eventClick: (info) => {
            window.selectedEventId = info.event.id;
            document.getElementById('eventTitle').value = info.event.title.replace(/^\d{2}:\d{2}\s/, '');
            document.getElementById('eventDesc').value = info.event.extendedProps.description || '';
            if (info.event.extendedProps.time) {
                document.getElementById('eventTime').value = info.event.extendedProps.time.substring(0, 5);
            }
            modal.style.display = 'block';
        }
    });
    calendar.render();

    document.getElementById('calendarToggle').addEventListener('click', (e) => {
        e.stopPropagation();
        calCont.classList.toggle('hidden');
        if (!calCont.classList.contains('hidden')) {
            calendar.updateSize();
        }
    });

    document.getElementById('geminiSearchForm').addEventListener('submit', function(e) {
        e.preventDefault(); 
        const queryText = document.getElementById('searchQuery').value;
        alert("Searching Gemini for: " + queryText);
    });

    window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

    document.getElementById('saveBtn').addEventListener('click', async () => {
        const payload = {
            title: document.getElementById('eventTitle').value,
            Description: document.getElementById('eventDesc').value,
            time: document.getElementById('eventTime').value ? document.getElementById('eventTime').value + ":00" : null,
            am_pm: document.getElementById('eventAmPm').checked
        };

        if (window.selectedEventId) {
            await mySupabase.from('events').update(payload).eq('id', window.selectedEventId);
        } else {
            await mySupabase.from('events').insert([{ ...payload, start_date: window.selectedDate }]);
        }
        location.reload();
    });

    document.getElementById('deleteBtn').addEventListener('click', async () => {
        if (window.selectedEventId) {
            await mySupabase.from('events').delete().eq('id', window.selectedEventId);
            location.reload();
        }
    });
});
// Function to display the output
function displayAIResponse(response) {
    const outputField = document.getElementById('ai-output');
    outputField.value = response; // This puts the text into the box
}
function appendToOutput(textChunk) {
    const outputField = document.getElementById('ai-output');
    outputField.value += textChunk; // Appends the new piece of text
    
    // Optional: Auto-scroll to the bottom
    outputField.scrollTop = outputField.scrollHeight;
}
document.getElementById('ai-output').value = '';
