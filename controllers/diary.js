const { Diary } = require('../models/diary');
const {User} = require('../models/user');
const {HttpError, ctrlWrapper} = require('../helpers');

const getDiary = async (req, res) => {
  const {_id: owner} = req.user;
  const {courseId, lessonId} = req.query;

  const result = await Diary.findOne(
    { owner, courseId, lessonId }, 
    "-_id -owner -createdAt -updatedAt"
  );
  
  if (!result) {
    return res.status(204).send("Щоденник вказаного дня ще не заповнено");
  }

  return res.status(200).json(result);
};

const addDiary = async (req, res) => {
  const { _id } = req.user;
  const { _id: owner } = req.user;
  const {courseId, lessonId, date, test, entry, plan} = req.body;

  const diary = await Diary.findOne(
    { owner, courseId, lessonId }
  );

  if (diary) {
    throw HttpError(409, "Щоденник вказаного дня вже створено");
  }

  const testNum = Number(test);
  const newDiary = await Diary.create({
    courseId,
    lessonId,
    date,
    test: testNum,
    entry,
    plan,
    owner,
  });

  const ukrainianMark = req.user.ukrainianMark + testNum;

  await User.findByIdAndUpdate(_id, {
    $set: { ukrainianMark },  
      $push: {
        historyUkrainianMark: {
          points: testNum,
          comment: `тестування: Граматичний курс. Урок ${lessonId}`,
          finalValue: ukrainianMark,
        }
      }
  });

  res.status(201).json({
    courseId: newDiary.courseId,
    lessonId: newDiary.lessonId,
    date: newDiary.date,
    test: newDiary.test,
    entry: newDiary.entry,
    plan: newDiary.plan,
  });
};

const updateDiary = async (req, res) => {
  const {_id} = req.user;
  const {_id: owner} = req.user;
  const {courseId, lessonId, date, test, entry, plan} = req.body;

  const diary = await Diary.findOne(
    { owner, courseId, lessonId }
  );

  if (!diary) {
    throw HttpError(404, "Щоденник вказаного дня не знайдено");
  }

  const testNum = Number(test);
  // const testNum = parseInt(test, 10);
  const update = {
    date,
    test,
    entry,
    plan,
  };

  const updatedDiary = await Diary.findOneAndUpdate(
    { owner, courseId, lessonId },
    { $set: update },
    { 
      new: true,
      projection: { _id: 0, owner: 0, createdAt: 0, updatedAt: 0 } 
    }
  );
  console.log(typeof test)
  if (test !== diary.test) {
    const ukrainianMark = req.user.ukrainianMark + test - diary.test;

    await User.findByIdAndUpdate(_id, {
      $set: { ukrainianMark },  
        $push: {
          historyUkrainianMark: {
            points: test - diary.test,
            comment: `повторне тестування: Граматичний курс. Урок ${lessonId}`,
            finalValue: ukrainianMark,
          }
        }
    });
  }

  res.status(201).json(updatedDiary);
};

module.exports = {
    getDiary: ctrlWrapper(getDiary),
    addDiary: ctrlWrapper(addDiary),
    updateDiary: ctrlWrapper(updateDiary),
};