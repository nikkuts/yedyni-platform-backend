const express = require('express');

const ctrl = require('../../controllers/canals');

const router = express.Router();

router.post('/webhook', ctrl.sendGift);

module.exports = router;