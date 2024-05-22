const express = require('express');

const ctrl = require('../../controllers/exercises');

const {authenticate, validateBody, upload, checkFileSize} = require('../../middlewares');

const {schemas} = require('../../models/exercise');

const router = express.Router();

router.get('/', authenticate, ctrl.getExercise);

router.get('/messages', authenticate, ctrl.getMessages);

router.get('/:exerciseId', authenticate, ctrl.getExerciseById);

router.post('/', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addExerciseSchema), ctrl.addExercise);

router.post('/comment', authenticate, validateBody(schemas.addCommentSchema), ctrl.addComment);

router.patch('/', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.updateExerciseSchema), ctrl.updateExercise);

router.patch('/homework', authenticate, ctrl.deleteHomeworkAndUpdateExercise);

router.patch('/file', authenticate, validateBody(schemas.deleteFileSchema), ctrl.deleteFileAndUpdateExercise);

router.patch('/comment', authenticate, validateBody(schemas.updateCommentSchema), ctrl.updateComment);

router.patch('/status', authenticate, ctrl.updateStatusComment);

router.delete('/comment', authenticate, ctrl.deleteComment);

module.exports = router;
