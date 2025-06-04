require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const session = require("express-session");

const Appointment = require("./models/Appointment");
const student = require("./models/student");
const teacher = require("./models/teacher");

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true with HTTPS
}));

// Middleware: Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) return res.redirect("/");
  next();
};

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to DB"))
  .catch(err => console.error("❌ DB Error", err));

// Home Page
app.get("/", (req, res) => {
  const loggedIn = !!req.session.userId;
  res.render("home", { loggedIn });
});

// ---------------- AUTH ROUTES ---------------- //

// Student Signup
app.get("/signup/student", (req, res) => {
  res.render("users/student_signup");
});

app.post("/signup/student", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newStudent = new student({ name, email, password: hashedPassword });
  await newStudent.save();
  res.redirect("/login/student");
});

// Teacher Signup
app.get("/signup/teacher", (req, res) => {
  res.render("users/teacher_signup");
});

app.post("/signup/teacher", async (req, res) => {
  const { name, email, password, department } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newTeacher = new teacher({ name, email, password: hashedPassword, department });
  await newTeacher.save();
  res.redirect("/login/teacher");
});

// Login Pages
app.get("/login/student", (req, res) => {
  res.render("users/student_login");
});

app.get("/login/teacher", (req, res) => {
  res.render("users/teacher_login");
});

// Student Login
app.post("/login/student", async (req, res) => {
  const { email, password } = req.body;
  const user = await student.findOne({ email });

  if (!user || !user.password || !password) {
    return res.send("Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("Incorrect password.");

  req.session.userId = user._id;
  res.redirect(`/appointments/student/${user._id}`);
});

// Teacher Login
app.post("/login/teacher", async (req, res) => {
  const { email, password } = req.body;
  const user = await teacher.findOne({ email });

  if (!user || !user.password || !password) {
    return res.send("Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("Incorrect password.");

  req.session.userId = user._id;
  res.redirect(`/appointments/teacher/${user._id}`);
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.send("Error logging out.");
    res.redirect("/");
  });
});

// ---------------- BOOKING ---------------- //

// Book - search teachers
app.get("/book/:studentId", isAuthenticated, async (req, res) => {
  const { studentId } = req.params;
  const search = req.query.search || "";
  const regex = new RegExp(search, "i");

  const teachers = await teacher.find({
    $or: [{ name: regex }, { department: regex }]
  });

  res.render("appointments/book", {
    teachers,
    studentId,
    search,
    selectedTeacher: null,
    loggedIn: true
  });
});

// Book a specific teacher
app.get("/book/:studentId/teacher/:teacherId", isAuthenticated, async (req, res) => {
  const { studentId, teacherId } = req.params;
  const selectedTeacher = await teacher.findById(teacherId);
  if (!selectedTeacher) return res.status(404).send("Teacher not found.");

  res.render("appointments/book", {
    teachers: [selectedTeacher],
    selectedTeacher,
    studentId,
    search: "",
    loggedIn: true
  });
});

// Submit appointment
app.post("/appointment/book", async (req, res) => {
  const { teacherId, studentId, date, time, purpose, message } = req.body;
  const appointmentTime = new Date(`${date}T${time}`);

  const newAppt = new Appointment({
    student: studentId,
    teacher: teacherId,
    appointmentTime,
    purpose,
    message,
    status: "pending"
  });

  await newAppt.save();
  res.redirect(`/appointments/student/${studentId}`);
});

// ---------------- VIEWS ---------------- //

// Student Appointments
app.get("/appointments/student/:id", isAuthenticated, async (req, res) => {
  const appointments = await Appointment.find({ student: req.params.id }).populate("teacher");
  res.render("appointments/student", {
    appointments,
    studentId: req.params.id,
    loggedIn: true
  });
});

// Teacher Appointments
app.get("/appointments/teacher/:id", isAuthenticated, async (req, res) => {
  const { search } = req.query;
  const teacherId = req.params.id;

  let appointments = await Appointment.find({ teacher: teacherId }).populate("student");

  if (search) {
    appointments = appointments.filter(a =>
      a.student.name.toLowerCase().includes(search.toLowerCase()) ||
      a.purpose.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.render("appointments/teacher", {
    appointments,
    teacherId,
    search,
    loggedIn: true
  });
});

// Approve/Reject Appointments
app.post("/appointments/:id/status", async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status });
  res.redirect(`/appointments/teacher/${appointment.teacher}`);
});

// Start server
app.listen(8080, () => console.log("🚀 Server running on port 8080"));
