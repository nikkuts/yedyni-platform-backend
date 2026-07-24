const express = require('express');

const ctrl = require('../../controllers/exercises');

const {
    authenticate,
    authorizeModerator,
    validateBody,
    upload,
    checkFileSize
} = require('../../middlewares');

const {schemas} = require('../../models/exercise');

const router = express.Router();

router.get('/', authenticate, ctrl.getExercise);

router.get('/notifications', authenticate, ctrl.getNotifications);

router.get('/:exerciseId', authenticate, ctrl.getExerciseById);

router.post('/', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addExerciseSchema), ctrl.addExercise);

router.post('/comment/create', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addCommentSchema), ctrl.addComment);

router.patch('/rating', authenticate, authorizeModerator, validateBody(schemas.updateRatingSchema), ctrl.updateRating);

router.patch('/', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.updateExerciseSchema), ctrl.updateExercise);

router.patch('/homework', authenticate, ctrl.deleteHomeworkAndUpdateExercise);

router.patch('/file', authenticate, validateBody(schemas.deleteFileSchema), ctrl.deleteFileAndUpdateExercise);

router.patch('/comment/edit', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.updateCommentSchema), ctrl.updateComment);

router.patch('/comment-status', authenticate, ctrl.updateCommentStatus);

router.delete('/comment/delete', validateBody(schemas.deleteCommentSchema),  authenticate, ctrl.deleteComment);

module.exports = router;
