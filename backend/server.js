import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middleware
app.use(cors({
  origin: '*', // Allow all origins in dev environment, can narrow down to http://localhost:5173 later
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Generic global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error Boundary caught:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
});

// Start initialization of DB and Express Server
async function startServer() {
  try {
    // Connect and verify MySQL tables and migrations
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Initialization failed: Server was not started.', error);
    process.exit(1);
  }
}

startServer();
