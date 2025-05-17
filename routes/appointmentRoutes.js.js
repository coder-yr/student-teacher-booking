// routes/appointmentRoutes.js

const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// GET /Appointment/list — render appointment data to EJS
router.get('/list', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('student')
      .populate('teacher')
      .lean(); // So EJS can handle it easily

    res.render('appointments/index', { appointments }); // points to views/appointments/index.ejs
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading appointments.");
  }
});

module.exports = router;
