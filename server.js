import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import profileRoutes from './routes/profile.js';
import aboutPostsRoutes from './routes/aboutPosts.js';
import messageRoutes from './routes/messages.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(
  cors({
    origin: [
      'https://my-portfolio-frontend-puce.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true
  })
);

app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas Connected Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/about-posts', aboutPostsRoutes);
app.use('/api/messages', messageRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.json({ message: 'Portfolio API Backend with MongoDB & Admin Auth is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});