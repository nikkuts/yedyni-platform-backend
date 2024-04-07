const express = require('express');

const ctrl = require('../../controllers/servants');

const router = express.Router();

router.post('/', ctrl.addServant);

router.post('/process', ctrl.processesServant);

router.get("/:servantId", ctrl.getByIdServant);

router.get("/", ctrl.getServants);

module.exports = router;