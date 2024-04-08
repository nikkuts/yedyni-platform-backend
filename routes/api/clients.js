const express = require('express');

const ctrl = require('../../controllers/clients');

const router = express.Router();

router.post('/servant', ctrl.addServant);

router.post('/process', ctrl.processesClient);

router.get("/:servantId", ctrl.getByIdServant);

router.get("/", ctrl.getServants);

module.exports = router;