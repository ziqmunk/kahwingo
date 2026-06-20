const express = require('express');
const cors = require('cors');
const { protect } = require('./middleware/auth');
const { getSavingsDashboard, addContribution } = require('./controllers/savingsController');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/savings/dashboard', protect, getSavingsDashboard);
app.post('/api/savings/contribution', protect, addContribution);

module.exports = app;