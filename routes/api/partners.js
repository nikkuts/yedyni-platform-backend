const express = require('express');

const ctrl = require('../../controllers/partners');

const {authenticate, isValidId} = require('../../middlewares');

const router = express.Router();

router.get("/indicators", authenticate, ctrl.getIndicators);

router.get("/", authenticate, ctrl.getTeam);

router.get("/:partnerId", authenticate, isValidId, ctrl.getByIdPartnerTeam);

module.exports = router;