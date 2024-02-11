const express = require('express');

const ctrl = require('../../controllers/payments');

const ctrlFilter = require('../../controllers/paymentsFilter');

const {authenticate, validateBody, isValidId} = require('../../middlewares');

const {schemas} = require('../../models/payment');

const router = express.Router();

router.post('/donat', authenticate, validateBody(schemas.donatSchema), ctrl.createPayment);

router.post('/unsubscribe', authenticate, validateBody(schemas.unsubscribeSchema), ctrl.cancelSubscribe);

router.post('/process', ctrl.processesPayment);

router.get('/donats', authenticate, ctrlFilter.getDonats);

router.get('/subscriptions', authenticate, ctrlFilter.getSubscriptions);

router.get("/subscriptions/:subscriptionId", authenticate, isValidId, ctrlFilter.getByIdSubscription);

// router.post("/subscriptions/:subscriptionId/unsubscribe", authenticate, isValidId, ctrlFilter.unSubscribes);

module.exports = router;
