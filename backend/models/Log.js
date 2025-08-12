// backend/models/Log.js
const mongoose = require("mongoose");

const singleLogSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    timeSpent: { type: Number, required: true }, // seconds
    date: { type: Date, default: Date.now },
  },
  { _id: false } // don't create separate _id for each subdocument
);

const logSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    logs: {
      type: [singleLogSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Optional: helper to push new logs (keeps controller logic small)
logSchema.methods.addLogs = async function (newLogs = []) {
  if (!Array.isArray(newLogs)) {
    throw new Error("newLogs must be an array");
  }
  this.logs.push(...newLogs);
  return this.save();
};

module.exports = mongoose.model("Log", logSchema);
