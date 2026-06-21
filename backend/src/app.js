const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const workspaceRouter = require('./routes/workspace');
const savingsRouter = require('./routes/savings');
const checklistRouter = require('./routes/checklist');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api/workspace', workspaceRouter);
app.use('/api/savings', savingsRouter);
app.use('/api/checklist', checklistRouter);

module.exports = app;