const mongoose = require("mongoose");
const { Exercise } = require('../models/exercise');
const { User } = require('../models/user');
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

const addHomework = async (req, res) => {
  const {_id: owner} = req.user;
  const { courseId, lessonId, homework, fileName } = req.body;
  const { file } = req;

  const exercise = await Exercise.findOne(
    {
      course: courseId,
      lessonId,
      owner
    }
  );

  if (exercise) {
    throw HttpError(409, "Вправа вказаного уроку вже створена");
  }

  const newExerciseData = {
    course: courseId,
    lessonId,
    owner,
    homework: homework.trim(),
  };

  if (file) {
    const downloadedFile = await uploadFileToCloudinary(file);

    newExerciseData.fileURL = downloadedFile.secure_url ?? '';
    newExerciseData.fileType = file.mimetype ?? '';
    newExerciseData.fileName = fileName ?? '';
  }

  const newExercise = await Exercise.create(newExerciseData);
  
  return res.status(201).json({
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

const updateHomework = async (req, res) => {
  const { exerciseId, homework, fileName, oldFileURL } = req.body;
  const { file } = req;

  const updateExerciseData = { 
    homework,
    status: 'active', 
  };

  if (oldFileURL) {
    await deleteFileFromCloudinary(oldFileURL);
  }

  if (file) {
    const downloadedFile = await uploadFileToCloudinary(file);

    updateExerciseData.fileURL = downloadedFile.secure_url;
    updateExerciseData.fileName = fileName;
    updateExerciseData.fileType = file.mimetype;
  } else if (oldFileURL) {
    updateExerciseData.fileURL = "";
    updateExerciseData.fileName = "";
    updateExerciseData.fileType = "";
  }

  const result = await Exercise.findByIdAndUpdate(
    exerciseId,
    { $set: updateExerciseData },
    { 
      new: true,
      projection: { status: 0, owner:0, createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("comments.author", "_id first_name last_name");

  if (!result) {
    throw HttpError(404, "Відсутня вправа");
  }

  res.status(200).json(result);
};

const updateHomeworkRating = async (req, res) => {
  const { _id: author } = req.user;
  const { exerciseId, rating } = req.body;

  const ratingNum = Number(rating);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const exercise = await Exercise.findById(exerciseId)
        .select("course lessonId rating owner comments")
        .populate([
          {
            path: "course", 
            select: "-_id title"
          },
        ])
        .session(session);

      if (!exercise) {
        throw HttpError(404, "Вправу не знайдено");
      }

      const user = await User.findById(exercise.owner)
          .select("ukrainianMark historyUkrainianMark")
          .session(session);

      if (!user) {
        throw HttpError(404, "Користувача не знайдено");
      }

      const diff = ratingNum - (exercise.rating ?? 0);
      
      exercise.rating = ratingNum;
      exercise.comments.push({
        author,
        comment: `Оцінка домашньої роботи: ${ratingNum}`,
        status: 'active',
      });

      await exercise.save({ session });

      if (diff !== 0) {
        const ukrainianMark = user.ukrainianMark + diff;

        user.ukrainianMark = ukrainianMark;
        user.historyUkrainianMark.push({
          points: diff,
          comment: `${diff === ratingNum ? "оцінка" : "змінена оцінка"} ${ratingNum} за домашню роботу: ${exercise.course.title}. Урок ${exercise.lessonId}`,
          finalValue: ukrainianMark,
        });

        await user.save({ session });
      }
    });

    res.status(200).json({
      rating: ratingNum,
    });
  } finally {
    await session.endSession();
  }
};

const deleteHomework = async (req, res) => {
  const { exerciseId, oldFileURL } = req.body;

  let updatedExercise;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const exercise = await Exercise.findById(exerciseId)
        .select("course lessonId rating owner")
        .populate([
          {
            path: "course", 
            select: "-_id title"
          },
        ])
        .session(session);

      if (!exercise) {
        throw HttpError(404, "Вправу не знайдено");
      }

      updatedExercise = await Exercise.findByIdAndUpdate(
        exerciseId,
        {
          $set: {
            homework: '',
            status: 'inactive',
            rating: null,
            fileURL: '',
            fileType: '',
            fileName: ''
          }
        },
        {
          new: true,
          projection: { status: 0, createdAt: 0, updatedAt: 0 }
        }
      )
        .populate([
          {
            path: "comments.author",
            select: "_id first_name last_name"
          },
        ])
        .session(session);

      const user = await User.findById(exercise.owner)
        .select("ukrainianMark historyUkrainianMark")
        .session(session);

      if (!user) {
        throw HttpError(404, "Користувача не знайдено");
      }

      if (exercise.rating) {
        user.ukrainianMark -= exercise.rating;

        user.historyUkrainianMark.push({
          points: -exercise.rating,
          comment: `видалена оцінка ${exercise.rating} за домашню роботу: ${exercise.course.title}. Урок ${exercise.lessonId}`,
          finalValue: user.ukrainianMark,
        });

        await user.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }

  if (oldFileURL) {
    await deleteFileFromCloudinary(oldFileURL);
  }

  res.status(200).json(updatedExercise);
};

const addComment = async (req, res) => {
  const {_id: author, status} = req.user;
  const { exerciseId, comment, fileName } = req.body;
  const { file } = req;

  const exercise = await Exercise.findById(exerciseId);

  if (!exercise) {
    throw HttpError(404, "Відсутня домашня робота");
  }

  const newComment = {
    author,
    comment: comment.trim(),
  };

  if (file) {
    const downloadedFile = await uploadFileToCloudinary(file);

    newComment.fileURL = downloadedFile.secure_url ?? '';
    newComment.fileType = file.mimetype ?? '';
    newComment.fileName = fileName ?? '';
  }

  const exerciseStatus =
    status === "moderator" || status === "admin"
      ? "inactive"
      : "active";

  if (status === "moderator" || status === "admin") {
    newComment.status = "active";
  }

  const updatedExercise = await Exercise.findByIdAndUpdate(
    exerciseId,
    {
      $set: { status: exerciseStatus },
      $push: {
        comments: newComment,
      },
    },
    { new: true }
  ).populate("comments.author", "_id first_name last_name");
  
  return res.status(201).json(
    updatedExercise.comments[updatedExercise.comments.length - 1]
  );
};

const updateComment = async (req, res) => {
  const {_id: author, status} = req.user;
  const { exerciseId, commentId, comment, fileName, oldFileURL } = req.body;
  const { file } = req;
  
  const exercise = await Exercise.findOne(
    {
        _id: exerciseId,
        "comments._id": commentId,
    },
    {
        owner: 1,
        comments: {
          $elemMatch: {
              _id: commentId,
          },
        },
    }
  );

  if (!exercise) {
    throw HttpError(404, "Відсутня домашня робота");
  }

  const oldComment = exercise.comments[0];

  const updateFields = {
    "comments.$.date": Date.now(),
    "comments.$.comment": comment,
  };

  if (status === "moderator" || status === "admin") {

    if (exercise.owner.toString() === author.toString()) {
        updateFields.status = "inactive";
    } else {
        updateFields["comments.$.status"] = "active";
        updateFields.status = "inactive";
    }
  } else {
      updateFields.status = "active";
  }

  if (oldFileURL) {
    await deleteFileFromCloudinary(oldFileURL);
  }

  if (file) {
    const downloadedFile = await uploadFileToCloudinary(file);

    updateFields["comments.$.fileURL"] = downloadedFile.secure_url;
    updateFields["comments.$.fileName"] = fileName;
    updateFields["comments.$.fileType"] = file.mimetype;
  } else if (oldFileURL) {
    updateFields["comments.$.fileURL"] = "";
    updateFields["comments.$.fileName"] = "";
    updateFields["comments.$.fileType"] = "";
  }

  await Exercise.findOneAndUpdate(
    {
        _id: exerciseId,
        "comments._id": commentId,
    },
    {
        $set: updateFields,
    }
);

  const updatedExercise = await Exercise.findOne(
    {
      _id: exerciseId,
      'comments._id': commentId
    },
    {
      comments: {
        $elemMatch: {
            _id: commentId,
        },
      }
    }
  )
  .populate("comments.author", "_id first_name last_name");

  if (!updatedExercise) {
    throw HttpError(404, "Відсутній коментар");
  }

  return res.status(200).json(updatedExercise.comments[0]);
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
  const { exerciseId, commentId, oldFileURL } = req.body;

  const exercise = await Exercise.findByIdAndUpdate(
    exerciseId,
    {
      $pull: {
        comments: { _id: commentId } 
      }
    }
  );

  if (!exercise) {
    throw HttpError(404, "Відсутня домашня робота");
  }

  if (oldFileURL) {
    await deleteFileFromCloudinary(oldFileURL);
  }

  return res.json({ commentId });
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
    addHomework: ctrlWrapper(addHomework),
    updateHomework: ctrlWrapper(updateHomework),
    updateHomeworkRating: ctrlWrapper(updateHomeworkRating),
    deleteHomework: ctrlWrapper(deleteHomework),
    addComment: ctrlWrapper(addComment),
    updateComment: ctrlWrapper(updateComment),
    updateCommentStatus: ctrlWrapper(updateCommentStatus),
    deleteComment: ctrlWrapper(deleteComment),
    getNotifications: ctrlWrapper(getNotifications),
    getExerciseById: ctrlWrapper(getExerciseById),
};
