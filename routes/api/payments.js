const express = require('express');

const ctrl = require('../../controllers/payments');

const ctrlClient = require('../../controllers/paymentsClient');

const {authenticate, validateBody} = require('../../middlewares');

const {schemas} = require('../../models/payment');

const router = express.Router();

router.post('/donat', authenticate, validateBody(schemas.donatSchema), ctrl.createPayment);

router.post('/unsubscribe', authenticate, validateBody(schemas.unsubscribeSchema), ctrl.cancelSubscribe);

router.post('/process', ctrl.processesPayment);

router.get('/donats', authenticate, ctrlClient.getDonats);

router.get('/subscriptions', authenticate, ctrlClient.getSubscriptions);

router.get("/subscriptions/:subscriptionId", authenticate, ctrlClient.getByIdSubscription);

router.get('/account', authenticate, ctrlClient.getAccount);

module.exports = router;
