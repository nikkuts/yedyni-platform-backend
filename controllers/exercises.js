const { Exercises } = require('../models/exercise');
const {
  uploadImageToCloudinary,
  getFileInfo,
  deleteImageFromCloudinary,
} = require("../utils");
const {HttpError, ctrlWrapper} = require('../helpers');

const getExercise = async (req, res) => {
  const {_id: owner} = req.user;
  const {courseId, lessonId} = req.query;

  const result = await Exercises.findOne(
    { owner, courseId, lessonId }, 
    "-createdAt -updatedAt"
  )
  .populate("comments.author", "_id name");
  
  if (!result) {
    return res.status(204).send("Вправа вказаного уроку ще не створена");
  }

  return res.status(200).json(result);
};

const addExercise = async (req, res) => {
  const { _id: owner } = req.user;
  const {courseId, lessonId, homework} = req.body;

  const exercise = await Exercises.findOne(
    { owner, courseId, lessonId }
  );

  if (exercise) {
    throw HttpError(409, "Вправа вказаного уроку вже створена");
  }

  let fileURL;
  if (req.file) {
    const { path } = req.file;
    const image = await uploadImageToCloudinary(path);
    fileURL = image.url;
  }

  const newExercise = await Exercises.create({
    courseId,
    lessonId,
    homework,
    fileURL,
    owner,
  });

  res.status(201).json({
    _id: newExercise._id,
    courseId: newExercise.courseId,
    lessonId: newExercise.lessonId,
    homework: newExercise.homework,
    fileURL: newExercise.fileURL,
    comments: newExercise.comments,
  });
};

const updateExercise = async (req, res) => {
  const {exerciseId, homework} = req.body;
  const update = { 
    homework,
    status: 'active', 
  };

  if (req.file) {
    const { path } = req.file;
    const image = await uploadImageToCloudinary(path);
    const fileURL = image.url;

    if (fileURL) {
      update.fileURL = fileURL;
    }
  }

  const result = await Exercises.findByIdAndUpdate(
    exerciseId,
    { $set: update },
    { 
      new: true,
      projection: { status: 0, owner:0, createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("comments.author", "_id name");

  if (!result) {
    throw HttpError(404, "Відсутня вправа");
  }

  res.status(201).json(result);
};

const deleteHomeworkAndUpdateExercise = async (req, res) => {
  const {exerciseId} = req.body;

  const result = await Exercises.findByIdAndUpdate(
    exerciseId,
    { $set: {homework: ''} },
    { 
      new: true,
      projection: { status: 0, owner:0, createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("comments.author", "_id name");

  res.status(201).json(result);
};

const deleteFileAndUpdateExercise = async (req, res) => {
  const {exerciseId, fileURL} = req.body;

  await deleteImageFromCloudinary(fileURL);

  const result = await Exercises.findByIdAndUpdate(
    exerciseId,
    { $set: {fileURL: ''} },
    { 
      new: true,
      projection: { status: 0, owner:0, createdAt: 0, updatedAt: 0 } 
    }
  )
  .populate("comments.author", "_id name");

  res.status(201).json(result);
};

const addComment = async (req, res) => {
  const {_id: author, status} = req.user;
  const {exerciseId, comment} = req.body;
  let updatedExercise;

  if (status === "moderator" || status === "admin") {
    updatedExercise = await Exercises.findByIdAndUpdate(
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
    .populate("comments.author", "_id name");
  } else {
    updatedExercise = await Exercises.findByIdAndUpdate(
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
    .populate("comments.author", "_id name");
  }

  if (!updatedExercise) {
    throw HttpError(404, "Відсутня домашня робота");
  }
  
  res.status(201).json(updatedExercise.comments[updatedExercise.comments.length - 1]);
};

const updateComment = async (req, res) => {
  const {_id: author, status} = req.user;
  const { exerciseId, commentId, comment } = req.body;

  if (status === "moderator" || status === "admin") {
    await Exercises.findOneAndUpdate(
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
  } else {
    await Exercises.findOneAndUpdate(
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

  const updatedExercise = await Exercises.findOne(
    { _id: exerciseId, 'comments._id': commentId },
    { 'comments.$': 1 }
  )
  .populate("comments.author", "_id name");

  if (!updatedExercise) {
    throw HttpError(404, "Відсутній коментар");
  }

  res.status(201).json(updatedExercise.comments[0]);
};

// const updateCommentStatus = async (req, res) => {
//   const { exerciseId, commentId } = req.query;

//   try {
//     await Exercises.findOneAndUpdate(
//       { _id: exerciseId, 'comments._id': commentId },
//       {
//         $set: {
//           'comments.$.status': "inactive",
//         }
//       }
//     );

//     res.json({ success: true, message: 'Статус коментаря успішно оновлено' });
//   }
//   catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Помилка при оновленні статусу коментаря' });
//   }

//     // await Exercises.findOneAndUpdate(
//     //   { _id: exerciseId, 'comments._id': commentId },
//     //   {
//     //     $set: {
//     //       'comments.$.status': "inactive",
//     //     }
//     //   }
//     // );

//     // res.json({ commentId });

// }

const updateCommentStatus = async (req, res) => {
  const { exerciseId, commentId } = req.query;

  try {
    // Знаходимо вправу
    const exercise = await Exercises.findById(exerciseId, "-_id comments");
    
    if (!exercise) {
      return res.status(404).send("Вправа не знайдена");
    }

    // Масив промісів для оновлення статусу коментарів
    const updatePromises = exercise.comments
      .filter(comment => comment.status === 'active')
      .map(comment => 
        Exercises.findOneAndUpdate(
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
    await Exercises.findByIdAndUpdate(
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

const getMessages = async (req, res) => {
  const {_id: owner, status } = req.user;
  let result;

  if (status === "moderator" || status === "admin") {
    result = await Exercises.find({  
      owner: { $ne: owner }, // $ne - не рівно
      status: "active"
    }, 
    "_id courseId lessonId owner updatedAt"
    )
    .populate({
      path: "owner",
      select: "name -_id"
    });
  } else {
    const aggResult = await Exercises.aggregate([
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
      { $project: { "_id": 1, "courseId": 1, "lessonId": 1, "comments._id": 1, "comments.author": 1, "comments.date": 1 } }
    ]);
    
    // Виконуємо популяцію для поля comments.author
    result = await Exercises.populate(aggResult, { 
      path: "comments.author", 
      select: "-_id name"
    });
  }

  const countMessages = result.length;

  return res.status(200).json({messages: result, countMessages});
};

const getExerciseById = async (req, res) => {
  const {status} = req.user;
  const {exerciseId} = req.params;
  let result;
  
  if (status === "moderator" || status === "admin") {
    result = await Exercises.findByIdAndUpdate(
      exerciseId,
      { $set: {status: "inactive"} },
      { 
        new: true,
        projection: { status: 0, createdAt: 0, updatedAt: 0 } 
      }
    )
    .populate('owner', '-_id name');
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
    getMessages: ctrlWrapper(getMessages),
    getExerciseById: ctrlWrapper(getExerciseById),
};