const express = require('express');
const { getMyCompany, updateGlobalBotMode } = require('../controllers/companyController');
const { protect } = require('../middlewares/authMiddleware');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(tenantMiddleware);

router.get('/me', getMyCompany);
router.patch('/me/bot-mode', updateGlobalBotMode);

module.exports = router;
