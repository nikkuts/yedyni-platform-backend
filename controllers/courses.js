const { Course } = require('../models/course');
const {HttpError, ctrlWrapper} = require('../helpers');

const getCourseById = async (req, res) => {
  const {courseId} = req.params;

  const result = await Course.findById(
    courseId, 
    "-createdAt -updatedAt"
  );
  
  if (!result) {
    throw HttpError(404);
  }

  return res.status(200).json(result);
};

const addCourse = async (req, res) => {
  
};

const updateCourse = async (req, res) => {
  const { courseId } = req.params;
  const updateData = req.body;

  const updatedCourse = await Course.findByIdAndUpdate(
    courseId, 
    updateData,
    { new: true}
  )
  .select('_id announcement');

  if (!updatedCourse) {
    throw HttpError(404, 'Курс не знайдено');
  }

  return res.status(200).json(updatedCourse);
};

const updateNextWaveCourse = async (req, res) => {
  const {courseId, nextWave, nextStart, nextCanal, nextViber, nextChat} = req.body;

  const updateData = {
    nextWave,
    nextStart,
    nextCanal,
    addedNextWave: new Date(),
  };

  if (nextViber !== undefined) updateData.nextViber = nextViber;
  if (nextChat !== undefined) updateData.nextChat = nextChat;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId, 
      updateData,
      { new: true}
    )
    .select('_id nextWave nextStart nextCanal nextChat addedNextWave');

    if (!updatedCourse) {
      throw HttpError(404, 'Курс не знайдено');
    }

    return res.status(200).json(updatedCourse);
};

const updateScheduledDateLesson = async (req, res) => {
  const {courseId, lessonId, scheduledDate} = req.body;

  const updatedCourse = await Course.findOneAndUpdate(
      {
        _id: courseId, 
        'lessons.day': lessonId
      }, 
      { $set: { 'lessons.$.scheduledDate': scheduledDate } },
      { new: true}
  );

  if (!updatedCourse) {
    throw HttpError(404, 'Курс або урок не знайдено');
  }

  const updatedLesson = updatedCourse.lessons.find(lesson => lesson.day === lessonId); 

  return res.status(200).json({
    lessonId, 
    scheduledDate: updatedLesson.scheduledDate
  });
};

module.exports = {
    getCourseById: ctrlWrapper(getCourseById),
    addCourse: ctrlWrapper(addCourse),
    updateCourse: ctrlWrapper(updateCourse),
    updateNextWaveCourse: ctrlWrapper(updateNextWaveCourse),
    updateScheduledDateLesson: ctrlWrapper(updateScheduledDateLesson),
};