// backend/routes/logRoutes.js
const express = require("express");
const Log = require("../models/Log");

const router = express.Router();

// POST /api/logs — save logs for a user
router.post("/", async (req, res) => {
  try {
    const { userId, logs } = req.body;

    if (!userId || !Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    let userLog = await Log.findOne({ userId });

    if (!userLog) {
      // If no existing log, create one
      userLog = new Log({ userId, logs });
      await userLog.save(); // Save the new document
    } else {
      // Append new logs (the addLogs method saves automatically)
      await userLog.addLogs(logs);
    }

    res.status(200).json({ message: "Logs saved successfully" });

  } catch (err) {
    console.error("Error saving logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/logs/:userId — retrieve logs for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userLog = await Log.findOne({ userId });

    if (!userLog) {
      return res.status(204).send(); // Use 204 No Content for empty results
    }

    res.status(200).json(userLog);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;