const { Course } = require('../models/course');
const {HttpError, ctrlWrapper} = require('../helpers');

const getCourse = async (req, res) => {
  const {courseId} = req.params;

  const result = await Course.findOne(
    { id: courseId }, 
    "-_id -createdAt -updatedAt"
  );
  
  if (!result) {
    throw HttpError(404);
  }

  return res.status(200).json(result);
};

const addCourse = async (req, res) => {
  
};

const updateCourse = async (req, res) => {
  
};

const updateScheduledDateLesson = async (req, res) => {
    const {status} = req.user;
    const {courseId, lessonId, scheduledDate} = req.body;

    if (status === "moderator" || status === "admin") {
        const updatedCourse = await Course.findOneAndUpdate(
            {
                id: courseId, 
                'lessons.day': lessonId
            }, 
            { $set: { 'lessons.$.scheduledDate': scheduledDate } },
            { 
                new: true,
                projection: { 'lessons.$': 1 } 
            }
        );

        const updatedLesson = updatedCourse.lessons[0]; // Отримуємо оновлений урок
    
        return res.status(200).json({scheduledDate: updatedLesson.scheduledDate});
    }
    return res.status(403).send('Недостатньо прав для виконання цієї операції');
};

module.exports = {
    getCourse: ctrlWrapper(getCourse),
    addCourse: ctrlWrapper(addCourse),
    updateCourse: ctrlWrapper(updateCourse),
    updateScheduledDateLesson: ctrlWrapper(updateScheduledDateLesson),
};