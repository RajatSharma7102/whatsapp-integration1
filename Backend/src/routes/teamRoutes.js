const express = require('express');
const { getTeams, createTeam, updateTeam, deleteTeam } = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

const router = express.Router();
router.use(protect);
router.use(tenantMiddleware);

router.get('/', getTeams);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

module.exports = router;
