const express = require('express');

const ctrl = require('../../controllers/payments');

const {authenticate, validateBody} = require('../../middlewares');

const {schemas} = require('../../models/payment');

const router = express.Router();

router.post('/donat', authenticate, validateBody(schemas.donatSchema), ctrl.createPayment);

router.post('/unsubscribe', authenticate, validateBody(schemas.unsubscribeSchema), ctrl.deleteSubscribe);

router.post('/process', ctrl.processesPayment);

module.exports = router;
