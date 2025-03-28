const express = require('express');

const ctrl = require('../../controllers/courses');

const {authenticate, validateBody} = require('../../middlewares');

const {schemas} = require('../../models/course');

const router = express.Router();

router.get('/:courseId', authenticate, ctrl.getCourseById);

// router.post('/', authenticate, validateBody(schemas.addDiarySchema), ctrl.addCourse);

router.patch('/next', authenticate, validateBody(schemas.updateNextWaveSchema), ctrl.updateNextWaveCourse);

router.patch('/lesson/date', authenticate, ctrl.updateScheduledDateLesson);

module.exports = router;