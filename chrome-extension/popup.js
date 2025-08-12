// // chrome-extension/popup.js
// document.getElementById("viewAnalytics").addEventListener("click", () => {
//   // Get the userId from storage to build the correct URL
//   chrome.storage.local.get("userId", (result) => {
//     if (result.userId) {
//       // Pass the userId as a URL query parameter
//       const dashboardUrl = `http://localhost:3000/analytics-dashboard/index.html?userId=${result.userId}`;
//       window.open(dashboardUrl, "_blank");
//     } else {
//       alert("User ID not found. Please reload the extension or try again later.");
//     }
//   });
// });


// popup.js

document.addEventListener('DOMContentLoaded', () => {
    // Send a message to the background script to get the initial data
    chrome.runtime.sendMessage({ type: "getPopupData" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }
        updateUI(response.isPaused, response.timeLogs);
    });
});

document.getElementById('togglePauseBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: "togglePause" }, (response) => {
        updateUI(response.isPaused);
    });
});

document.getElementById('viewAnalyticsBtn').addEventListener('click', () => {
    chrome.storage.local.get("userId", (result) => {
        if (result.userId) {
            const dashboardUrl = `http://localhost:3000/analytics-dashboard/index.html?userId=${result.userId}`;
            window.open(dashboardUrl, "_blank");
        }
    });
});

function updateUI(isPaused, timeLogs) {
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    const toggleBtn = document.getElementById('togglePauseBtn');

    // Update status indicator
    if (isPaused) {
        statusText.textContent = "Paused";
        statusDot.className = "status-dot paused";
        toggleBtn.textContent = "Resume";
        toggleBtn.classList.add('paused');
    } else {
        statusText.textContent = "Active";
        statusDot.className = "status-dot active";
        toggleBtn.textContent = "Pause";
        toggleBtn.classList.remove('paused');
    }

    // Update top sites list if data is provided
    if (timeLogs) {
        const listElement = document.getElementById('top-sites-list');
        listElement.innerHTML = ''; // Clear existing list

        const sortedSites = Object.entries(timeLogs).sort(([, a], [, b]) => b - a).slice(0, 3);

        if (sortedSites.length === 0) {
            listElement.innerHTML = '<li class="placeholder">No activity yet.</li>';
        } else {
            sortedSites.forEach(([url, time]) => {
                const minutes = Math.floor(time / 60);
                const listItem = document.createElement('li');
                listItem.innerHTML = `<span class="site-name">${url}</span> <span class="site-time">${minutes} min</span>`;
                listElement.appendChild(listItem);
            });
        }
    }
}