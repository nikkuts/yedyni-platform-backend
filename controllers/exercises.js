const { Exercise } = require('../models/exercise');
const {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
} = require("../utils");
const {HttpError, ctrlWrapper} = require('../helpers');

const getExercise = async (req, res) => {
  const {_id: owner} = req.user;
  const {courseId, lessonId} = req.query;

  const result = await Exercise.findOne(
    { owner, course: courseId, lessonId }, 
    "-createdAt -updatedAt"
  )
  .populate("comments.author", "_id first_name last_name");
  
  if (!result) {
    return res.status(204).send("Вправа вказаного уроку ще не створена");
  }

  return res.status(200).json(result);
};

const addExercise = async (req, res) => {
  const { file } = req;
  const { originalname } = req.body;
  const { _id: owner } = req.user;
  const {courseId, lessonId, homework} = req.body;

  const exercise = await Exercise.findOne(
    { owner, course: courseId, lessonId }
  );

  if (exercise) {
    throw HttpError(409, "Вправа вказаного уроку вже створена");
  }

  let fileURL;
  let fileType;
  let fileName;

  if (file) {
    const downloadedFile = await uploadFileToCloudinary(file);

    fileURL = downloadedFile.secure_url;
    fileType = file.mimetype;
    fileName = originalname;
  }

  const newExercise = await Exercise.create({
    course: courseId,
    lessonId,
    homework,
    fileURL,
    fileType,
    fileName,
    owner,
  });

  res.status(201).json({
    _id: newExercise._id,
    courseId: newExercise.course,
    lessonId: newExercise.lessonId,
    homework: newExercise.homework,
    fileURL: newExercise.fileURL,
    fileType: newExercise.fileType,
    fileName: newExercise.fileName,
    comments: newExercise.comments,
  });
};

const updateExercise = async (req, res) => {
  const { file } = req;
  const { originalname } = req.body;
  const {exerciseId, homework} = req.body;
  const update = { 
    homework,
    status: 'active', 
  };

  if (file) {
    const downloadedFile = await uploadFileToCloudinary(file);
    const fileURL = downloadedFile.secure_url;
    const fileType = file.mimetype;
    const fileName = originalname;

    if (fileURL) {
      update.fileURL = fileURL;
      update.fileType = fileType;
      update.fileName = fileName;
    }
  }

  const result = await Exercise.findByIdAndUpdate(
    exerciseId,
    { $set: update },
    { 
      new: true,
      projection: { status: 0, owner:0, createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("comments.author", "_id first_name last_name");

  if (!result) {
    throw HttpError(404, "Відсутня вправа");
  }

  res.status(201).json(result);
};

const deleteHomeworkAndUpdateExercise = async (req, res) => {
  const {exerciseId} = req.body;

  const result = await Exercise.findByIdAndUpdate(
    exerciseId,
    { $set: {homework: ''} },
    { 
      new: true,
      projection: { status: 0, owner:0, createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("comments.author", "_id first_name last_name");

  res.status(201).json(result);
};

const deleteFileAndUpdateExercise = async (req, res) => {
  const {exerciseId, fileURL} = req.body;

  await deleteFileFromCloudinary(fileURL);

  const result = await Exercise.findByIdAndUpdate(
    exerciseId,
    { $set: {fileURL: '', fileType: '', fileName: ''} },
    { 
      new: true,
      projection: { status: 0, owner:0, createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("comments.author", "_id first_name last_name");

  res.status(201).json(result);
};

const addComment = async (req, res) => {
  const {_id: author, status} = req.user;
  const {exerciseId, comment} = req.body;
  let updatedExercise;

  const exercise = await Exercise.findById(exerciseId, "owner");

  if (!exercise) {
    throw HttpError(404, "Відсутня домашня робота");
  }

  if (status === "moderator" || status === "admin") {

    if (exercise.owner.toString() === author.toString()) {
      updatedExercise = await Exercise.findByIdAndUpdate(
        exerciseId,
        {
          $set: {status: 'inactive'},
          $push: {
            comments: {
              author,
              comment,
            }
          }
        },
        { new: true }
      )
      .populate("comments.author", "_id first_name last_name");
    } else {
      updatedExercise = await Exercise.findByIdAndUpdate(
        exerciseId,
        {
          $set: {status: 'inactive'},
          $push: {
            comments: {
              author,
              comment,
              status: 'active',
            }
          }
        },
        { new: true }
      )
      .populate("comments.author", "_id first_name last_name");
    }
  } else {
    updatedExercise = await Exercise.findByIdAndUpdate(
      exerciseId,
      {
        $set: {status: 'active'},
        $push: {
          comments: {
            author,
            comment,
          }
        }
      },
      { new: true }
    )
    .populate("comments.author", "_id first_name last_name");
  }
  
  res.status(201).json(updatedExercise.comments[updatedExercise.comments.length - 1]);
};

const updateComment = async (req, res) => {
  const {_id: author, status} = req.user;
  const { exerciseId, commentId, comment } = req.body;

  const exercise = await Exercise.findById(exerciseId, "owner");

  if (!exercise) {
    throw HttpError(404, "Відсутня домашня робота");
  }

  if (status === "moderator" || status === "admin") {

    if (exercise.owner.toString() === author.toString()) {
      await Exercise.findOneAndUpdate(
        { _id: exerciseId, 'comments._id': commentId },
        {
          $set: {
            'comments.$.date': Date.now(),
            'comments.$.comment': comment,
            status: "inactive"
          }
        }
      );
    } else {
      await Exercise.findOneAndUpdate(
        { _id: exerciseId, 'comments._id': commentId },
        {
          $set: {
            'comments.$.date': Date.now(),
            'comments.$.comment': comment,
            'comments.$.status': "active",
            status: "inactive"
          }
        }
      );
    }
  } else {
    await Exercise.findOneAndUpdate(
      { _id: exerciseId, 'comments._id': commentId },
      {
        $set: {
          'comments.$.date': Date.now(),
          'comments.$.comment': comment,
          status: "active"
        }
      }
    );
  }

  const updatedExercise = await Exercise.findOne(
    { _id: exerciseId, 'comments._id': commentId },
    { 'comments.$': 1 }
  )
  .populate("comments.author", "_id first_name last_name");

  if (!updatedExercise) {
    throw HttpError(404, "Відсутній коментар");
  }

  res.status(201).json(updatedExercise.comments[0]);
};

const updateCommentStatus = async (req, res) => {
  const { exerciseId } = req.query;

  try {
    const exercise = await Exercise.findById(exerciseId, "-_id comments");
    
    if (!exercise) {
      return res.status(404).send("Вправа не знайдена");
    }

    // Масив промісів для оновлення статусу коментарів
    const updatePromises = exercise.comments
      .filter(comment => comment.status === 'active')
      .map(comment => 
        Exercise.findOneAndUpdate(
          { _id: exerciseId, 'comments._id': comment._id },
          { $set: { 'comments.$.status': 'inactive' } },
          { new: true }
        )
      );

    // Виконуємо всі оновлення
    await Promise.all(updatePromises);

    res.status(200).send("Статус коментарів оновлено");
  } catch (error) {
    res.status(500).send("Помилка сервера");
  }
};

const deleteComment = async (req, res) => {
  const { exerciseId, commentId } = req.query;

  try {
    await Exercise.findByIdAndUpdate(
      exerciseId,
      {
        $pull: {
          comments: { _id: commentId } 
        }
      }
    );

    res.json({ commentId });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Помилка при видаленні коментаря' });
  }
}

const getNotifications = async (req, res) => {
  const {_id: owner, status } = req.user;
  let result;

  if (status === "moderator" || status === "admin") {
    result = await Exercise.find({  
      owner: { $ne: owner }, // $ne - не рівно
      status: "active"
    }, 
    "_id course lessonId owner updatedAt"
    )
    .populate([
      {
        path: "owner", 
        select: "-_id first_name last_name"
      },
      {
        path: "course", 
        select: "-_id title"
      }
    ]);
  } else {
    const aggResult = await Exercise.aggregate([
      // Спочатку знаходимо вправи власника
      { $match: { owner: owner } },
      
      // Розкладаємо масив comments
      { $unwind: "$comments" },
      
      // Фільтруємо коментарі, щоб залишити лише ті, які належать невласнику і мають статус "active"
      { $match: { "comments.author": { $ne: owner }, "comments.status": "active" } },
      
      // Групуємо назад вправи, щоб відновити структуру
      { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
      
      // Відновлюємо початкову структуру документа
      { $replaceRoot: { newRoot: "$doc" } },
      
      // Вибираємо лише необхідні поля для відповіді
      { $project: { "_id": 1, "course": 1, "lessonId": 1, "comments._id": 1, "comments.author": 1, "comments.date": 1 } }
    ]);
    
    // Виконуємо популяцію для полів comments.author і courseId
    result = await Exercise.populate(aggResult, [
      { 
        path: "comments.author", 
        select: "-_id first_name last_name"
      },
      { 
        path: "course", 
        select: "_id title"  
      }
    ]);
  }

  const countNotifications = result.length;

  return res.status(200).json({notifications: result, countNotifications});
};

const getExerciseById = async (req, res) => {
  const {status} = req.user;
  const {exerciseId} = req.params;
  let result;
  
  if (status === "moderator" || status === "admin") {
    await Exercise.findByIdAndUpdate(
      exerciseId,
      { $set: {status: "inactive"} }
    );

    result = await Exercise.findById(
      exerciseId,
      '-status -createdAt -updatedAt'
    )
    .populate([
      {
        path: "owner", 
        select: "-_id first_name last_name"
      },
      {
        path: "course", 
        select: "-_id title"
      },
      {
        path: "comments.author", 
        select: "_id first_name last_name"
      },
    ]);
  } else {
    throw HttpError (401, 'Відсутні права доступу')
  }

  if (!result) {
    throw HttpError (404, 'Відсутня вправа')
  } 

  return res.status(200).json(result);
};

module.exports = {
    getExercise: ctrlWrapper(getExercise),
    addExercise: ctrlWrapper(addExercise),
    updateExercise: ctrlWrapper(updateExercise),
    deleteHomeworkAndUpdateExercise: ctrlWrapper(deleteHomeworkAndUpdateExercise),
    deleteFileAndUpdateExercise: ctrlWrapper(deleteFileAndUpdateExercise),
    addComment: ctrlWrapper(addComment),
    updateComment: ctrlWrapper(updateComment),
    updateCommentStatus: ctrlWrapper(updateCommentStatus),
    deleteComment: ctrlWrapper(deleteComment),
    getNotifications: ctrlWrapper(getNotifications),
    getExerciseById: ctrlWrapper(getExerciseById),
};