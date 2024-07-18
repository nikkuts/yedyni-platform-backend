const express = require('express');

const ctrl = require('../../controllers/deals');

const router = express.Router();

router.post('/servant', ctrl.addServant);

router.post('/creative', ctrl.addCreative);

router.post('/proukrainian', ctrl.addProukrainian);

router.post('/process', ctrl.processesDeal);

// router.get("/servants", ctrl.getServants);

// router.get("/creatives", ctrl.getCreatives);

router.get("/:dealId", ctrl.getByIdDeal);

module.exports = router;