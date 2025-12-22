const express = require('express');

const ctrl = require('../../controllers/contacts');

const router = express.Router();

router.post('/register/:courseId', ctrl.registerContact);

router.post('/creative', ctrl.addCreative);

router.post('/proukrainian', ctrl.addProukrainian);

router.post('/process', ctrl.processesDeal);

router.post('/manual-process', ctrl.manualProcessesDeal);

router.get("/:dealId", ctrl.getByIdDeal);

router.post('/transition', ctrl.addTransition);

router.post('/grammatical', ctrl.addGrammatical);

router.post('/donat', ctrl.addDonat);

router.post('/process-donat', ctrl.processesDonat);



router.post('/editcontact', ctrl.sendEmailContact);

router.post('/edituspacy', ctrl.editLead);

module.exports = router;