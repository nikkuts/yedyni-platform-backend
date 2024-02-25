const express = require('express');

const ctrl = require('../../controllers/exercises');

const {authenticate, validateBody, isValidId, upload, checkFileSize} = require('../../middlewares');

const {schemas} = require('../../models/exercise');

const router = express.Router();

router.post('/', authenticate, upload.single("images"), checkFileSize, validateBody(schemas.addExerciseSchema), ctrl.addExercise);

// router.get('/', authenticate, ctrl.getAll);

// router.get('/:contactId', authenticate, isValidId, ctrl.getById);

// router.post('/', authenticate, validateBody(schemas.addSchema), ctrl.add);

// router.delete('/:contactId', authenticate, isValidId, ctrl.removeById);

router.patch('/', authenticate, upload.single("images"), checkFileSize, validateBody(schemas.addExerciseSchema), ctrl.updateExercise);

// router.patch('/:contactId/favorite', authenticate, isValidId, validateBody(schemas.updateFavoriteSchema), ctrl.updateStatusContact);

module.exports = router;
