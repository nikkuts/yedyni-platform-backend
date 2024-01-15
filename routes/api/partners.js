const express = require('express');

const ctrl = require('../../controllers/partners');

const {authenticate, isValidId} = require('../../middlewares');

const router = express.Router();

router.get("/indicators", authenticate, ctrl.getIndicators);

router.get("/", authenticate, ctrl.getPartners);

router.get("/:partnerId", authenticate, isValidId, ctrl.getByIdPartner);

router.get("/:partnerId/team", authenticate, isValidId, ctrl.getPartnerTeam);

module.exports = router;