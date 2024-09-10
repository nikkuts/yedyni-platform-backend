const express = require('express');

const ctrl = require('../../controllers/courses');

const {authenticate, validateBody} = require('../../middlewares');

// const {schemas} = require('../../models/course');

const router = express.Router();

// router.get('/', authenticate, ctrl.getCourse);

// router.post('/', authenticate, validateBody(schemas.addDiarySchema), ctrl.addCourse);

// router.patch('/', authenticate, ctrl.updateCourse);

router.patch('/lesson/date', authenticate, ctrl.updateScheduledDateLesson);

module.exports = router;