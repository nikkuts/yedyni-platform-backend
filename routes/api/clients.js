const express = require('express');

const ctrl = require('../../controllers/clients');

const router = express.Router();

router.post('/servant', ctrl.addServant);

router.post('/process', ctrl.processesClient);

router.get("/servants", ctrl.getServants);

router.get("/:servantId", ctrl.getByIdServant);

module.exports = router;