const express = require('express');

const ctrl = require('../../controllers/contacts');

const router = express.Router();

router.post('/transition', ctrl.addTransition);

router.post('/grammatical', ctrl.addGrammatical);

// router.post('/process', ctrl.processesContact);

router.post('/hookuspacy', ctrl.eventUspacy);

router.post('/edituspacy', ctrl.editUspacy);

router.post('/editcontact', ctrl.editContactUspacy);

module.exports = router;