// seeder.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Student = require("../models/student");
const Teacher = require('../models/teacher');
const Appointment = require('../models/Appointment');

const MONGO_URL = "mongodb://127.0.0.1:27017/Appointment";

// Connect to DB
main()
  .then(() => {
    console.log("✅ Connected to DB");
    seedData();
  })
  .catch(err => console.error("❌ DB Connection Error:", err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

const seedData = async () => {
  try {
    // Clear existing data
    await Student.deleteMany();
    await Teacher.deleteMany();
    await Appointment.deleteMany();

    // Hash student passwords
    const hashedStudent1 = await bcrypt.hash('test123', 10);
    const hashedStudent2 = await bcrypt.hash('pass456', 10);

    // Add students
    const students = await Student.insertMany([
      {
        name: 'Yash Sharma',
        email: 'yash@example.com',
        password: hashedStudent1,
        department: 'Computer Science',
        messages: [],
      },
      {
        name: 'Anjali Mehra',
        email: 'anjali@example.com',
        password: hashedStudent2,
        department: 'Information Technology',
        messages: [],
      },
    ]);

    // Hash teacher passwords
    const hashedTeacher1 = await bcrypt.hash('teach123', 10);
    const hashedTeacher2 = await bcrypt.hash('teach456', 10);

    // Add teachers
    const teachers = await Teacher.insertMany([
      {
        name: 'Dr. Rahul Verma',
        email: 'rahul.verma@example.com',
        password: hashedTeacher1,
        department: 'Computer Science',
        subject: 'Data Structures',
      },
      {
        name: 'Prof. Neha Kapoor',
        email: 'neha.kapoor@example.com',
        password: hashedTeacher2,
        department: 'Information Technology',
        subject: 'Database Systems',
      },
    ]);

    // Add appointments
    await Appointment.insertMany([
      {
        student: students[0]._id,
        teacher: teachers[0]._id,
        purpose: 'Clarification on assignment 2',
        appointmentTime: new Date('2025-04-20T10:00:00Z'),
        status: 'pending',
        message: 'Need help with sorting algorithms.',
      },
      {
        student: students[1]._id,
        teacher: teachers[1]._id,
        purpose: 'Project guidance',
        appointmentTime: new Date('2025-04-22T14:30:00Z'),
        status: 'approved',
        message: 'Want to discuss my final year project.',
      },
    ]);

    console.log('✅ Sample Data Inserted');
    process.exit();
  } catch (err) {
    console.error('❌ Error while seeding:', err);
    process.exit(1);
  }
};
