// chrome-extension/background.js

let isPaused = false;

// CONFIGURATION
const API_ENDPOINT = "http://localhost:3000/api/logs";
const IDLE_TIME_SECONDS = 30; // Mark as idle after 30 seconds of no activity
const SYNC_ALARM_NAME = "syncAlarm";
const SYNC_PERIOD_MINUTES = 1; // Sync with backend every 15 minutes

// STATE
let activeTabInfo = {
  tabId: null,
  url: null,
  startTime: null,
};

let userId = null;

// --- INITIALIZATION ---

// 1. Get or create a unique user ID
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("userId", (res) => {
    if (res.userId) {
      userId = res.userId;
    } else {
      userId = crypto.randomUUID();
      chrome.storage.local.set({ userId: userId });
    }
    console.log("TimeTracker user ID:", userId);
  });

  // 2. Create an alarm for periodic data syncing
  chrome.alarms.create(SYNC_ALARM_NAME, {
    periodInMinutes: SYNC_PERIOD_MINUTES,
  });
  console.log(`Alarm "${SYNC_ALARM_NAME}" created for every ${SYNC_PERIOD_MINUTES} minutes.`);
});

// Ensure userId is loaded on startup
chrome.storage.local.get("userId", (res) => {
  if (res.userId) userId = res.userId;
});

// --- CORE TRACKING LOGIC ---

async function handleTabChange(tabId) {
  if (isPaused) return; // Add this check
  // A tab change happened, so log the time spent on the previous tab.
  await logTime();

  // If the new tabId is null (e.g., all windows closed), stop tracking.
  if (!tabId) {
    activeTabInfo = { tabId: null, url: null, startTime: null };
    return;
  }

  // Get details of the new active tab
  try {
    const tab = await chrome.tabs.get(tabId);
    // Only track standard web pages
    if (tab.url && (tab.url.startsWith("http:") || tab.url.startsWith("https://"))) {
      activeTabInfo = {
        tabId: tabId,
        url: tab.url,
        startTime: Date.now(),
      };
    } else {
      // It's a system page like chrome://extensions, so stop tracking for now.
      activeTabInfo = { tabId: null, url: null, startTime: null };
    }
  } catch (error) {
    // Tab might have been closed before we could get it.
    console.log(`Could not get tab ${tabId}. It may have been closed.`, error);
    activeTabInfo = { tabId: null, url: null, startTime: null };
  }
}

async function logTime() {
  if (isPaused) return; 
  if (!activeTabInfo.url || !activeTabInfo.startTime) return;

  const endTime = Date.now();
  const timeSpentSeconds = Math.round((endTime - activeTabInfo.startTime) / 1000);

  if (timeSpentSeconds < 1) return; // Don't log very short intervals

  const hostname = new URL(activeTabInfo.url).hostname;
  console.log(`Logging ${timeSpentSeconds}s for ${hostname}`);

  const { timeLogs = {} } = await chrome.storage.local.get("timeLogs");
  timeLogs[hostname] = (timeLogs[hostname] || 0) + timeSpentSeconds;

  await chrome.storage.local.set({ timeLogs });

  // Reset start time for the current tab to now
  activeTabInfo.startTime = endTime;
}

// --- EVENT LISTENERS ---

// Fired when the active tab in a window changes.
chrome.tabs.onActivated.addListener((activeInfo) => {
  handleTabChange(activeInfo.tabId);
});

// Fired when a tab is updated (e.g., user navigates to a new URL in the same tab).
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    handleTabChange(tabId);
  }
});

// Fired when the focused window changes.
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // User clicked away from Chrome, log time and stop tracking.
    await logTime();
    activeTabInfo = { tabId: null, url: null, startTime: null };
  } else {
    // User focused back on a Chrome window, find its active tab and start tracking.
    const [tab] = await chrome.tabs.query({ active: true, windowId: windowId });
    if (tab) {
      handleTabChange(tab.id);
    }
  }
});

// Fired when the system's idle state changes.
chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === "active") {
    // User is back, find the current tab and restart tracking.
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab) {
      handleTabChange(tab.id);
    }
  } else {
    // User is idle, locked, or screensaver is on. Log time and stop.
    await logTime();
    activeTabInfo = { tabId: null, url: null, startTime: null };
  }
});

// Set the idle detection interval
chrome.idle.setDetectionInterval(IDLE_TIME_SECONDS);

// --- DATA SYNCHRONIZATION ---

// Listener for the sync alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    console.log("Alarm triggered: Syncing data with backend...");
    await syncData();
  }
});

async function syncData() {
  if (!userId) {
    console.error("Cannot sync: userId is not set.");
    return;
  }
  
  const { timeLogs } = await chrome.storage.local.get("timeLogs");

  if (!timeLogs || Object.keys(timeLogs).length === 0) {
    console.log("No new data to sync.");
    return;
  }

  // Format logs for the backend API
  const logsPayload = Object.entries(timeLogs).map(([url, timeSpent]) => ({
    url: url,
    timeSpent: timeSpent,
    date: new Date().toISOString(),
  }));

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, logs: logsPayload }),
    });

    if (response.ok) {
      console.log("✅ Data synced successfully!");
      // Clear local logs after successful sync
      await chrome.storage.local.remove("timeLogs");
    } else {
      console.error("❌ Failed to sync data:", response.status, await response.text());
    }
  } catch (error) {
    console.error("❌ Network error during sync:", error);
  }
}


// --- MESSAGE LISTENER ---
// This allows the popup to communicate with this background script.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    // Handles the request from the popup to get the latest data
    if (message.type === "getPopupData") {
        chrome.storage.local.get("timeLogs", (result) => {
            sendResponse({
                isPaused: isPaused,
                timeLogs: result.timeLogs || {}
            });
        });
        return true; // Keep message channel open for async response
    }
    
    // Handles the click of the "Pause" / "Resume" button
    if (message.type === "togglePause") {
        isPaused = !isPaused;
        
        // Update the extension icon to give visual feedback
        const iconPath = isPaused ? "images/icon_paused.png" : "images/icon128.png";
        chrome.action.setIcon({ path: iconPath });
        
        // Send back the new pause state to the popup
        sendResponse({ isPaused: isPaused });
    }
});
