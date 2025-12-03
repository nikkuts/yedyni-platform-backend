const express = require('express');
const ctrl = require('../../controllers/courses');
const {
    authenticate,
    authorizeAdmin,
    authorizeModerator,
    validateBody
} = require('../../middlewares');
const {schemas} = require('../../models/course');

const router = express.Router();

router.get('/:courseId', authenticate, ctrl.getCourseById);

// router.post('/', authenticate, authorizeAdmin, ctrl.addCourse);

router.patch('/:courseId', authenticate, authorizeModerator, ctrl.updateCourse);

router.patch('/wave/next', authenticate, authorizeAdmin, validateBody(schemas.updateNextWaveSchema), ctrl.updateNextWaveCourse);

router.patch('/lesson/date', authenticate, authorizeModerator, ctrl.updateScheduledDateLesson);

module.exports = router;