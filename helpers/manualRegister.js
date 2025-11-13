require('dotenv').config();
const {nanoid} = require('nanoid');
const bcrypt = require('bcrypt');
const { User } = require('../models/user');
const { Deal } = require('../models/deal');
const { HttpError } = require('../helpers');
const sendCourseEmail = require('../emails');
const {
  authUspacy,
  moveStageDealUspacy,
} = require('../utils');

const BASE_UKRAINIAN_MARK = Number(process.env.BASE_UKRAINIAN_MARK);

const manualRegister = async (dealUspacyId, result = { status: "success" }) => {
  try {
    const deal = await Deal.findOneAndUpdate(
      { dealUspacyId },
      { payment: result },
      { new: true }
    )
      .populate("contact", "first_name last_name email")
      .populate("course", "_id title registration paymentStageId")
      .lean();

    if (!deal) throw HttpError(404, "Угоду не знайдено");

    const { first_name, last_name, email } = deal.contact;

    // 1️⃣ Отримання JWT токена від Uspacy
    const jwt = await authUspacy();

    // 2️⃣ Оновлення етапу оплати в Uspacy
    await moveStageDealUspacy({
      token: jwt,
      dealId: deal.dealUspacyId,
      stageId: deal.course.paymentStageId,
    });

    // 3️⃣ Перевіряємо, чи існує користувач
    const user = await User.findOne({ email });

    if (user) {
      // Якщо користувач існує — додаємо курс (якщо його ще нема)
      if (!user.courses.includes(deal.course._id)) {
        user.courses.push(deal.course._id);
        await user.save();
      }

      // Відправка листа про успішну оплату
      await sendCourseEmail(
        deal.course.registration,
        "payment",
        email
      );

      return;
    }

    // 4️⃣ Генеруємо пароль і створюємо користувача
    const generatedPassword = nanoid(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      courses: [deal.course._id],
      ukrainianMark: BASE_UKRAINIAN_MARK,
      historyUkrainianMark: [
        {
          points: BASE_UKRAINIAN_MARK,
          comment: "реєстрація на платформі",
          finalValue: BASE_UKRAINIAN_MARK,
        },
      ],
    });

    // 5️⃣ Відправляємо лист із даними для входу
    await sendCourseEmail(
      deal.course.registration,
      "access",
      email,
      {
        email,
        password: generatedPassword,
      }
    );

  } catch (error) {
    console.error(error);
  }
};

module.exports = manualRegister;
