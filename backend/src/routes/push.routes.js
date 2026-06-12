const express = require('express');
const router = express.Router();
const pushController = require('../controllers/push.controller');

router.post('/register', pushController.registerToken);
router.post('/simulate', pushController.simulateNotify);

module.exports = router;
