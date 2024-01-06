const express = require('express');

const ctrl = require('../../controllers/partners');

const {authenticate, isValidId} = require('../../middlewares');

const router = express.Router();

router.get("/indicators", authenticate, ctrl.getIndicators);

router.get("/", authenticate, ctrl.getFirstLinePartners);

router.get("/:partnerId", authenticate, isValidId, ctrl.getByIdPartner);

router.get("/:partnerId/structure", authenticate, isValidId, ctrl.getPartnerStructure);

module.exports = router;