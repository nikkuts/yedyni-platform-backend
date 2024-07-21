const express = require('express');

const ctrl = require('../../controllers/contacts');

const router = express.Router();

router.post('/servant', ctrl.addServant);

router.post('/creative', ctrl.addCreative);

router.post('/proukrainian', ctrl.addProukrainian);

router.post('/process', ctrl.processesDeal);

router.get("/:dealId", ctrl.getByIdDeal);

router.post('/transition', ctrl.addTransition);

router.post('/grammatical', ctrl.addGrammatical);

router.post('/editcontact', ctrl.sendEmailContact);

router.post('/edituspacy', ctrl.editLead);

module.exports = router;