const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { protect } = require('./middleware/auth');
const { getSavingsDashboard, addContribution } = require('./controllers/savingsController');
const workspaceRouter = require('./routes/workspace');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,       // e.g. https://kahwingo-frontend-production.up.railway.app
  'http://localhost:5173',        // local dev (Vite default)
  'http://localhost:4173',        // local preview
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());


// Workspace routes
app.use('/api/workspace', workspaceRouter);

// Savings routes
app.get('/api/savings/dashboard', protect, getSavingsDashboard);
app.post('/api/savings/contribution', protect, addContribution);

module.exports = app;