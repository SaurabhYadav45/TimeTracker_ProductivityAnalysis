// dashboard/script.js

// Global Chart Options for Dark Theme
Chart.defaults.color = '#a0a0b8';
Chart.defaults.borderColor = '#3a3d5b';

// --- MAIN SCRIPT ---
window.addEventListener("load", async () => {
  const loadingElement = document.getElementById("loading-state");
  const dashboardElement = document.getElementById("dashboard-content");

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");

  if (!userId) {
    loadingElement.textContent = "Error: User ID not found. Please open this page from the extension.";
    loadingElement.classList.add("text-danger");
    return;
  }

  try {
    const response = await fetch(`/api/logs/${userId}`);
    if (response.status === 204) {
      loadingElement.textContent = "No tracking data found yet. Start Browse to log some time!";
      return;
    }
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}.`);
    }

    const data = await response.json();
    loadingElement.classList.add("d-none");
    dashboardElement.classList.remove("d-none");
    
    renderDashboard(data.logs);

  } catch (error) {
    console.error("Dashboard Error:", error);
    loadingElement.textContent = `Error: ${error.message}`;
    loadingElement.classList.add("text-danger");
  }
});

function renderDashboard(logs) {
  if (!logs || logs.length === 0) return;
  
  // Destroy old charts if they exist
  if (window.timeChart) window.timeChart.destroy();
  if (window.dailyChart) window.dailyChart.destroy();

  // Aggregate data
  const timePerUrl = aggregateTimePerUrl(logs);
  const timePerDay = aggregateTimePerDay(logs);
  
  // Render all components
  renderKpiCards(logs, timePerUrl, timePerDay);
  renderGoalTracker(logs);
  renderTimeSpentChart(timePerUrl);
  renderDailyActivityChart(timePerDay);
  renderLogsTable(timePerUrl, logs);
  renderTopSitesDonutChart(timePerUrl);
}

// --- DATA AGGREGATION ---
function aggregateTimePerUrl(logs) {
    return logs.reduce((acc, log) => {
        acc[log.url] = (acc[log.url] || 0) + log.timeSpent;
        return acc;
    }, {});
}

function aggregateTimePerDay(logs) {
    return logs.reduce((acc, log) => {
        const date = new Date(log.date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + log.timeSpent;
        return acc;
    }, {});
}

// --- COMPONENT RENDERING ---
function renderKpiCards(logs, timePerUrl, timePerDay) {
    // Total Time
    const totalSeconds = logs.reduce((sum, log) => sum + log.timeSpent, 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    document.getElementById("total-time").textContent = `${totalHours}h`;

    // Most Active Day
    const mostActive = Object.entries(timePerDay).sort(([, a], [, b]) => b - a)[0];
    document.getElementById("most-active-day").textContent = new Date(mostActive[0]).toLocaleDateString(undefined, { weekday: 'long' });

    // Top Website
    const topWebsite = Object.entries(timePerUrl).sort(([, a], [, b]) => b - a)[0];
    document.getElementById("top-website").textContent = topWebsite[0];
}

function renderTimeSpentChart(timePerUrl) {
  const sortedSites = Object.entries(timePerUrl).sort(([, a], [, b]) => b - a).slice(0, 10);
  const labels = sortedSites.map(site => site[0]);
  const data = sortedSites.map(site => (site[1] / 60).toFixed(2));

  window.timeChart = new Chart(document.getElementById("timeSpentChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Time Spent (minutes)",
        data: data,
        backgroundColor: 'rgba(0, 123, 255, 0.6)',
        borderColor: 'rgba(0, 123, 255, 1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
        plugins: { legend: { display: false }, title: { display: true, text: 'Top 10 Websites by Time Spent' } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
    }
  });
}



function renderDailyActivityChart(timePerDay) {
  const sortedDays = Object.entries(timePerDay).sort(([a], [b]) => new Date(a) - new Date(b));
  const labels = sortedDays.map(day => new Date(day[0]).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}));
  const data = sortedDays.map(day => (day[1] / 3600).toFixed(2));

  window.dailyChart = new Chart(document.getElementById("dailyActivityChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Productivity (hours)",
        data: data,
        borderColor: "rgba(40, 167, 69, 1)",
        backgroundColor: "rgba(40, 167, 69, 0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
        plugins: { legend: { display: false }, title: { display: true, text: 'Daily Activity Trend' } },
        scales: { y: { beginAtZero: true } }
    }
  });
}


function renderLogsTable(timePerUrl, logs) {
    const tableBody = document.getElementById("logs-table-body");
    tableBody.innerHTML = ''; // Clear previous data

    // Create a map of the last logged date for each URL
    const lastLoggedMap = logs.reduce((acc, log) => {
        if (!acc[log.url] || new Date(log.date) > new Date(acc[log.url])) {
            acc[log.url] = log.date;
        }
        return acc;
    }, {});

    const sortedSites = Object.entries(timePerUrl).sort(([, a], [, b]) => b - a);
    
    sortedSites.forEach(([url, totalTime]) => {
        const timeInMinutes = (totalTime / 60).toFixed(0);
        const lastLogged = new Date(lastLoggedMap[url]).toLocaleDateString();

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${url}</td>
            <td>${timeInMinutes} min</td>
            <td>${lastLogged}</td>
        `;
        tableBody.appendChild(row);
    });
}


// Add this function to your script.js

function renderTopSitesDonutChart(timePerUrl) {
    if (window.donutChart) window.donutChart.destroy();

    const sortedSites = Object.entries(timePerUrl).sort(([, a], [, b]) => b - a).slice(0, 5);
    const labels = sortedSites.map(site => site[0]);
    const data = sortedSites.map(site => site[1]);
    const totalTrackedTime = Object.values(data).reduce((sum, a) => sum + a, 0);

    window.donutChart = new Chart(document.getElementById("topSitesDonutChart"), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Time Spent (s)',
                data: data,
                backgroundColor: [
                    'rgba(0, 123, 255, 0.7)',
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(23, 162, 184, 0.7)'
                ],
                borderColor: 'var(--card-color)',
                borderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Top 5 Websites'
                }
            }
        }
    });
}


function renderGoalTracker(logs) {
    const dailyGoalHours = 4; // Set your daily goal in hours here
    const today = new Date().toISOString().split('T')[0];

    // Calculate time tracked only for today
    const secondsToday = logs
        .filter(log => new Date(log.date).toISOString().startsWith(today))
        .reduce((sum, log) => sum + log.timeSpent, 0);
    
    const hoursToday = (secondsToday / 3600);
    const percentage = Math.min((hoursToday / dailyGoalHours) * 100, 100);

    // Update the UI elements
    document.getElementById('goal-text').textContent = `${hoursToday.toFixed(1)}h / ${dailyGoalHours}h`;
    document.getElementById('goal-progress-bar').style.width = `${percentage}%`;
    document.getElementById('goal-progress-bar').setAttribute('aria-valuenow', percentage);
    document.getElementById('goal-percentage').textContent = `${Math.round(percentage)}% complete`;
}
