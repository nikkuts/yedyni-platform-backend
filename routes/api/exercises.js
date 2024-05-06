const express = require('express');

const ctrl = require('../../controllers/exercises');

const {authenticate, validateBody, isValidId, upload, checkFileSize} = require('../../middlewares');

const {schemas} = require('../../models/exercise');

const router = express.Router();

router.get('/', authenticate, ctrl.getExercise);

router.post('/', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addExerciseSchema), ctrl.addExercise);

// router.get('/:contactId', authenticate, isValidId, ctrl.getById);

// router.post('/', authenticate, validateBody(schemas.addSchema), ctrl.add);

// router.delete('/:contactId', authenticate, isValidId, ctrl.removeById);

router.post('/comment', authenticate, validateBody(schemas.addCommentSchema), ctrl.addComment);

router.patch('/', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addExerciseSchema), ctrl.updateExercise);

router.patch('/file', authenticate, validateBody(schemas.deleteFileSchema), ctrl.deleteFileAndUpdateExercise);

router.patch('/comment', authenticate, validateBody(schemas.addCommentSchema), ctrl.updateComment);

router.delete('/comment', authenticate, ctrl.deleteComment);

module.exports = router;
