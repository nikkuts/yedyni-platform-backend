const express = require('express');

const ctrl = require('../../controllers/exercises');

const {authenticate, validateBody, upload, checkFileSize} = require('../../middlewares');

const {schemas} = require('../../models/exercise');

const router = express.Router();

router.get('/', authenticate, ctrl.getExercise);

router.get('/active', authenticate, ctrl.getActiveExercises);

router.get('/:exerciseId', authenticate, ctrl.getByIdExercise);

router.post('/', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addExerciseSchema), ctrl.addExercise);

router.post('/comment', authenticate, validateBody(schemas.addCommentSchema), ctrl.addComment);

router.patch('/', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addExerciseSchema), ctrl.updateExercise);

router.patch('/file', authenticate, validateBody(schemas.deleteFileSchema), ctrl.deleteFileAndUpdateExercise);

router.patch('/comment', authenticate, validateBody(schemas.addCommentSchema), ctrl.updateComment);

router.delete('/comment', authenticate, ctrl.deleteComment);

module.exports = router;
