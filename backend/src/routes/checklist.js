const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getChecklists, createChecklist, updateChecklist, deleteChecklist } = require('../controllers/checklistController');

router.get('/', protect, getChecklists);
router.post('/', protect, createChecklist);
router.put('/:id', protect, updateChecklist);
router.delete('/:id', protect, deleteChecklist);

module.exports = router;
