const express = require('express');

const ctrl = require('../../controllers/payments');

const ctrlFilter = require('../../controllers/paymentsFilter');

const {authenticate, validateBody} = require('../../middlewares');

const {schemas} = require('../../models/payment');

const router = express.Router();

router.post('/donat', authenticate, validateBody(schemas.donatSchema), ctrl.createPayment);

router.post('/unsubscribe', authenticate, validateBody(schemas.unsubscribeSchema), ctrl.deleteSubscribe);

router.post('/process', ctrl.processesPayment);

router.get('/donats', authenticate, ctrlFilter.getDonats);

router.get('/subscribes', authenticate, ctrlFilter.getSubscribes);

module.exports = router;
