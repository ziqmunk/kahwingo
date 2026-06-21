const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSavingsDashboard, getContributions, addContribution, editContribution, deleteContribution } = require('../controllers/savingsController');

router.get('/dashboard', protect, getSavingsDashboard);
router.get('/contributions', protect, getContributions);
router.post('/contribution', protect, addContribution);
router.put('/contribution/:id', protect, editContribution);
router.delete('/contribution/:id', protect, deleteContribution);

module.exports = router;
