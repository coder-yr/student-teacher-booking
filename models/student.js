const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  department: String,
  messages: [String]
});

module.exports = mongoose.model("Student", studentSchema);
