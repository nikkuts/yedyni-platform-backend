const express = require('express');

const ctrl = require('../../controllers/bonuses');

const {authenticate, isValidId} = require('../../middlewares');

const router = express.Router();

router.get("/", authenticate, ctrl.getIndicators);

router.get("/partners", authenticate, ctrl.getFirstLinePartners);

router.get("/partners/:partnerId", authenticate, isValidId, ctrl.getByIdPartner);

router.get("/partners/:partnerId/structure", authenticate, isValidId, ctrl.getPartnerStructure);

module.exports = router;