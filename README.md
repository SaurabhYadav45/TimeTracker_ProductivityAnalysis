# Time Tracker & Productivity Analytics

A full-stack web application featuring a Chrome Extension for automatic time tracking and a web-based dashboard for visualizing productivity data. This project captures time spent on different websites, detects user inactivity, and provides a rich interface to analyze personal productivity trends.

## Screenshots

<table width="100%">
 <tr>
    <td width="70%" valign="top"><b>Dashboard</b></td>
    <td width="30%" valign="top"><b>Chrome Extension Popup</b></td>
 </tr>
 <tr>
    <td><img width="1887" height="907" alt="Screenshot 2025-08-12 234929" src="https://github.com/user-attachments/assets/f70791d3-ead0-4db6-9b0d-335a1a10b55a" /></td>
    <td><img width="1896" height="1014" alt="Screenshot 2025-08-12 234851" src="https://github.com/user-attachments/assets/33932b01-b486-4891-91ee-e72b7d3ddc6a" /></td>
 </tr>
</table>


## Features

- **Automatic Time Tracking:** Passively tracks time spent on different websites in Chrome.
- **Idle Detection:** Automatically pauses the timer when the user is inactive.
- **Pause & Resume:** Manually pause and resume tracking directly from the extension popup.
- **Live Popup Data:** The extension popup provides an at-a-glance summary of current activity and status.
- **Backend Data Sync:** Periodically syncs tracked data to a central MongoDB database.
- **Interactive Dashboard:** A rich, single-page application to visualize all historical data.
- **Data Visualization:**
    - Key Performance Indicator (KPI) cards for high-level stats (Total Time, Top Website, etc.).
    - A daily goal tracker with a progress bar.
    - Charts showing daily activity trends and time spent per website.
    - A detailed table view of all logged data.
- **Modern UI/UX:** A clean, responsive, dark-themed interface built with Bootstrap and custom CSS.

## Tech Stack

- **Backend:** Node.js, Express.js, Mongoose, MongoDB
- **Frontend (Dashboard):** HTML5, CSS3, JavaScript, Chart.js, Bootstrap
- **Chrome Extension:** Chrome Extension APIs (Manifest V3), JavaScript

---

## Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (which includes npm)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a connection string from a cloud provider like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- [Google Chrome](https://www.google.com/chrome/) browser.

### 1. Backend Setup

First, set up and run the server.

```bash
# 1. Clone the repository (if you haven't already)
git clone <your-repository-url>
cd <your-project-folder>

# 2. Navigate to the backend directory
cd backend

# 3. Install dependencies
npm install

# 4. Create an environment file
# Create a file named .env in the /backend folder and add your configuration:
# MONGO_URI=your_mongodb_connection_string
# PORT=3000

# 5. Start the server
node app.js
```
Your backend should now be running on `http://localhost:3000`.

### 2. Chrome Extension Setup

Next, load the extension into your Chrome browser.

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** using the toggle in the top-right corner.
3.  Click the **"Load unpacked"** button.
4.  In the file selection dialog, select the `chrome-extension` folder from the project directory.
5.  The extension icon will appear in your Chrome toolbar.

You're all set! The extension will now track your activity and send it to your local backend. Click the extension icon and then "View Dashboard" to see your analytics.

## Project Structure

```
.
├── backend/                # Node.js, Express, and Mongoose API
│   ├── models/
│   ├── routes/
│   └── app.js
├── chrome-extension/       # All files for the Chrome Extension
│   ├── images/
│   ├── background.js
│   ├── manifest.json
│   ├── popup.html
│   └── popup.js
└── dashboard/              # The frontend analytics dashboard
    ├── index.html
    ├── script.js
    └── style.css
```

---

## API Endpoints

The backend exposes the following simple API endpoints:

| Method | Endpoint         | Description                        |
| :----- | :--------------- | :--------------------------------- |
| `POST` | `/api/logs`      | Saves a batch of time logs for a user. |
| `GET`  | `/api/logs/:userId` | Retrieves all time logs for a specific user. |

## Future Improvements

- **User Authentication:** Implement a full login/signup system so users can access their data from any device.
- **Custom Goals:** Allow users to set their own daily productivity goals from the dashboard.
- **Date Range Filtering:** Add date pickers to the dashboard to filter analytics by specific time periods.
- **Data Export:** Add a feature to export tracked data as a CSV or JSON file.

## License

This project is licensed under the MIT License.
