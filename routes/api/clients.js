const express = require('express');

const ctrl = require('../../controllers/clients');

const router = express.Router();

router.post('/servant', ctrl.addServant);

router.post('/creative', ctrl.addCreative);

router.post('/proukrainian', ctrl.addProukrainian);

router.post('/process', ctrl.processesClient);

router.get("/servants", ctrl.getServants);

router.get("/creatives", ctrl.getCreatives);

router.get("/:clientId", ctrl.getByIdClient);

module.exports = router;