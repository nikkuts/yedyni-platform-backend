const express = require('express');

const ctrl = require('../../controllers/diary');

const {authenticate, validateBody} = require('../../middlewares');

const {schemas} = require('../../models/diary');

const router = express.Router();

router.get('/', authenticate, ctrl.getDiary);

router.post('/', authenticate, validateBody(schemas.addDiarySchema), ctrl.addDiary);

router.patch('/', authenticate, validateBody(schemas.addDiarySchema), ctrl.updateDiary);

module.exports = router;