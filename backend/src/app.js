const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { protect } = require('./middleware/auth');
const { getSavingsDashboard, addContribution } = require('./controllers/savingsController');
const workspaceRouter = require('./routes/workspace');

const app = express();

app.use(cors());
app.use(express.json());

// Workspace routes
app.use('/api/workspace', workspaceRouter);

// Savings routes
app.get('/api/savings/dashboard', protect, getSavingsDashboard);
app.post('/api/savings/contribution', protect, addContribution);

module.exports = app;