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

  const exercise = await Exercises.findOne(
    { owner, courseId, lessonId }, 
    "-createdAt -updatedAt"
  );
  
  if (!exercise) {
    return res.status(204).send("Вправа вказаного уроку ще не створена");
  }

  const result = {exerciseId: exercise._id, ...exercise.toObject()};
  delete result._id;

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
    exerciseId: newExercise._id,
    courseId: newExercise.courseId,
    lessonId: newExercise.lessonId,
    homework: newExercise.homework,
    fileURL: newExercise.fileURL,
    status: newExercise.status,
    comments: newExercise.comments,
    owner: newExercise.owner,
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

  const updatedExercise = await Exercises.findByIdAndUpdate(
    exerciseId,
    { $set: update },
    { 
      new: true,
      projection: { createdAt: 0, updatedAt: 0 } 
    }
  );

  if (!updatedExercise) {
    throw HttpError(404, "Відсутня вправа");
  }

  const result = {exerciseId: updatedExercise._id, ...updatedExercise.toObject()};
  delete result._id;

  res.status(201).json(result);
};

const deleteHomeworkAndUpdateExercise = async (req, res) => {
  const {exerciseId} = req.body;

  const updatedExercise = await Exercises.findByIdAndUpdate(
    exerciseId,
    { $set: {homework: ''} },
    { 
      new: true,
      projection: { createdAt: 0, updatedAt: 0 } 
    }
  );

  const result = {exerciseId: updatedExercise._id, ...updatedExercise.toObject()};
  delete result._id;

  res.status(201).json(result);
};

const deleteFileAndUpdateExercise = async (req, res) => {
  const {exerciseId, fileURL} = req.body;

  await deleteImageFromCloudinary(fileURL);

  const updatedExercise = await Exercises.findByIdAndUpdate(
    exerciseId,
    { $set: {fileURL: ''} },
    { 
      new: true,
      projection: { createdAt: 0, updatedAt: 0 } 
    }
  );

  const result = {exerciseId: updatedExercise._id, ...updatedExercise.toObject()};
  delete result._id;

  res.status(201).json(result);
};

const addComment = async (req, res) => {
  const {status} = req.user;
  const {exerciseId, author, comment} = req.body;
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
          }
        }
      },
      { new: true }
    );
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
    );
  }

  if (!updatedExercise) {
    throw HttpError(404, "Відсутня домашня робота");
  }
  
  res.status(201).json(updatedExercise.comments[updatedExercise.comments.length - 1]);
};

const updateComment = async (req, res) => {
  const {status} = req.user;
  const { exerciseId, commentId, author, comment } = req.body;

  if (status === "moderator" || status === "admin") {
    await Exercises.findOneAndUpdate(
      { _id: exerciseId, 'comments._id': commentId },
      {
        $set: {
          'comments.$.date': Date.now(),
          'comments.$author': author,
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
          'comments.$author': author,
          'comments.$.comment': comment,
          'comments.$.status': "active",
          status: "active"
        }
      }
    );
  }

  const updatedExercise = await Exercises.findOne(
    { _id: exerciseId, 'comments._id': commentId },
    { 'comments.$': 1 }
  );

  if (!updatedExercise) {
    throw HttpError(404, "Відсутній коментар");
  }

  res.status(201).json(updatedExercise.comments[0]);
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
  const {_id: owner, status, name} = req.user;
  let result;

  if (status === "moderator" || status === "admin") {
    result = await Exercises.find({  
      owner: { $ne: owner }, // $ne - не рівно
      status: "active"
    }, 
    "_id owner courseId lessonId updatedAt"
    )
    .populate({
      path: "owner",
      select: "name -_id"
    });
  } else {
    result = await Exercises.find({ 
      owner: owner, 
      'comments.author': { $ne: name },
      'comments.status': "active", 
    }, 
    "_id status courseId lessonId updatedAt"
    )
  }

  // const result = {exerciseId: exercise._id, ...exercise.toObject()};
  // delete result._id;

  return res.status(200).json(result);
};

const getExerciseById = async (req, res) => {
  const {status} = req.user;
  const {exerciseId} = req.params;
  let exercise;
  
  if (status === "moderator" || status === "admin") {
    exercise = await Exercises.findByIdAndUpdate(
      exerciseId,
      { $set: {status: "inactive"} },
      { 
        new: true,
        projection: { _id: 0, createdAt: 0, updatedAt: 0 } 
      }
    ).populate('owner', 'name -id');
  } else {
    exercise = await Exercises.findById(
      exerciseId, 
      "-id -createdAt -updatedAt"
    );
  }

  if (!exercise) {
    throw HttpError (404, 'Відсутня вправа')
  }

  const result = {exerciseId: exerciseId, ...exercise.toObject()};

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
    deleteComment: ctrlWrapper(deleteComment),
    getMessages: ctrlWrapper(getMessages),
    getExerciseById: ctrlWrapper(getExerciseById),
};



// const updateExercise = async (req, res) => {
//   const {_id: owner} = req.user;
//   const {courseId, lessonId, homework} = req.body;

//   const exercise = await Exercises.findOne(
//     { owner, courseId, lessonId }
//   );

//   if (!exercise) {
//     throw HttpError(404, "Вправа вказаного уроку не знайдена");
//   }

//   let fileURL;
//   if (req.file) {
//     const { path } = req.file;
//     const image = await uploadImageToCloudinary(path);
//     fileURL = image.url;
//   }

//   const update = { 
//     homework,
//     status: 'active', 
//   };

//   if (fileURL) {
//     update.fileURL = fileURL;
//   }

//   const updatedExercise = await Exercises.findOneAndUpdate(
//     { owner, courseId, lessonId },
//     { $set: update },
//     { 
//       new: true,
//       projection: { createdAt: 0, updatedAt: 0 } 
//     }
//   );

//   res.status(201).json(updatedExercise);
// };

// const deleteFileAndUpdateExercise = async (req, res) => {
//   const {_id: owner} = req.user;
//   const {courseId, lessonId, fileURL} = req.body;

//   await deleteImageFromCloudinary(fileURL);
  
//   // const fileInfo = await getFileInfo(fileURL);

//   // if (fileInfo && Object.keys(fileInfo).length > 0) {
//   //   await deleteImageFromCloudinary(fileURL);
//   // } else {
//   //   throw HttpError(404, "Файл не знайдено");
//   // } 

//   const updatedExercise = await Exercises.findOneAndUpdate(
//     { owner, courseId, lessonId },
//     { $set: {fileURL: ''} },
//     { 
//       new: true,
//       projection: { _id: 0, owner: 0, createdAt: 0, updatedAt: 0 } 
//     }
//   );

//   res.status(201).json(updatedExercise);
// };

// const addComment = async (req, res) => {
//   const { _id: owner } = req.user;
//   const {courseId, lessonId, author, comment} = req.body;

//   const updatedExercise = await Exercises.findOneAndUpdate(
//     { owner, courseId, lessonId },
//     {
//       $set: {status: 'active'},
//       $push: {
//         comments: {
//           author,
//           comment,
//         }
//       }
//     },
//     { new: true }
//   );

//   if (!updatedExercise) {
//     throw HttpError(404, "Відсутня домашня робота");
//   }
  
//   res.status(201).json(updatedExercise.comments[updatedExercise.comments.length - 1]);
// };

// const updateComment = async (req, res) => {
//   const { _id: owner } = req.user;
//   const { courseId, lessonId, author, comment, commentId } = req.body;

//   await Exercises.findOneAndUpdate(
//     { owner, courseId, lessonId, 'comments._id': commentId },
//     {
//       $set: {
//         'comments.$.date': Date.now(),
//         'comments.$.author': author,
//         'comments.$.comment': comment,
//         status: "active"
//       }
//     }
//   );

//   const updatedExercise = await Exercises.findOne(
//     { owner, courseId, lessonId, 'comments._id': commentId },
//     { 'comments.$': 1 }
//   );

//   if (!updatedExercise) {
//     throw HttpError(404, "Коментар не знайдено");
//   }

//   res.status(201).json(updatedExercise.comments[0]);
// };

// const deleteComment = async (req, res) => {
//   const { _id: owner } = req.user;
//   const { courseId, lessonId, commentId } = req.query;

//   try {
//     await Exercises.findOneAndUpdate(
//       { owner, courseId, lessonId },
//       {
//         $pull: {
//           comments: { _id: commentId } 
//         }
//       }
//     );

//     res.json({ commentId });
//   }
//   catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Помилка при видаленні коментаря' });
//   }
// }

// const getMessages = async (req, res) => {
//   const {_id: owner, status, name} = req.user;
//   let result;

//   if (status === "moderator" || status === "admin") {
//     result = await Exercises.find({  
//       owner: { $ne: owner }, // $ne - не рівно
//       status: "active"
//     }, 
//     "_id owner courseId lessonId updatedAt"
//     )
//     .populate({
//       path: "owner",
//       select: "name -_id"
//     });
//   } else {
//     result = await Exercises.find({ 
//       owner: owner, 
//       'comments.author': { $ne: name } 
//     }, 
//     "_id status courseId lessonId updatedAt"
//     )
//     // .populate({
//     //   path: "owner",
//     //   select: "name -_id"
//     // });
//   }

//   return res.status(200).json(result);
// };

// const getByIdExercise = async (req, res) => {
//   const {status} = req.user;
//   const {exerciseId} = req.params;
//   let result;
  
//   if (status === "moderator" || status === "admin") {
//     result = await Exercises.findByIdAndUpdate(
//       exerciseId,
//       { $set: {status: "inactive"} },
//       { 
//         new: true,
//         projection: { _id: 0, createdAt: 0, updatedAt: 0 } 
//       }
//     ).populate('owner', 'name');
//   } else {
//     result = await Exercises.findById(
//       exerciseId, 
//       "-_id -owner -createdAt -updatedAt"
//     );
//   }

//   if (!result) {
//     throw HttpError (404, 'Not found')
//   }

//   return res.status(200).json(result);
// };

// module.exports = {
//     getExercise: ctrlWrapper(getExercise),
//     addExercise: ctrlWrapper(addExercise),
//     updateExercise: ctrlWrapper(updateExercise),
//     deleteFileAndUpdateExercise: ctrlWrapper(deleteFileAndUpdateExercise),
//     addComment: ctrlWrapper(addComment),
//     updateComment: ctrlWrapper(updateComment),
//     deleteComment: ctrlWrapper(deleteComment),
//     getMessages: ctrlWrapper(getMessages),
//     getByIdExercise: ctrlWrapper(getByIdExercise),
// };