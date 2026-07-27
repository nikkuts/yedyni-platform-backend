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

router.post('/homework/create', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addHomeworkSchema), ctrl.addHomework);

router.post('/comment/create', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.addCommentSchema), ctrl.addComment);

router.patch('/homework/edit', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.updateHomeworkSchema), ctrl.updateHomework);

router.patch('/comment/edit', authenticate, upload.single("file"), checkFileSize, validateBody(schemas.updateCommentSchema), ctrl.updateComment);

router.patch('/homework-rating', authenticate, authorizeModerator, validateBody(schemas.updateRatingSchema), ctrl.updateHomeworkRating);

router.patch('/comment-status', authenticate, ctrl.updateCommentStatus);

router.delete('/homework/delete', validateBody(schemas.deleteHomeworkSchema), authenticate, ctrl.deleteHomework);

router.delete('/comment/delete', validateBody(schemas.deleteCommentSchema),  authenticate, ctrl.deleteComment);

module.exports = router;
