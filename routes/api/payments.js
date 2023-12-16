const express = require('express');

const ctrl = require('../../controllers/payments');

const {authenticate, validateBody, isValidId} = require('../../middlewares');

// const {schemas} = require('../../models/contact');

const router = express.Router();

router.post('/donat', ctrl.createPayment);

router.post('/callback', ctrl.processesPayment);

module.exports = router;
