const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const { emailRegexp, dateRegexp, nameRegexp, phoneRegexp, passwordRegex } = require("../utils");

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Вкажіть імя користувача'],
      },
      password: {
        type: String,
        minlength: 6,
        required: [true, 'Встановіть пароль довжиною не менше 6 символів'],
      },
      email: {
        type: String,
        match: emailRegexp,
        required: [true, 'Введіть ваш Email'],
        unique: true,
      },
      status: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
      },
      avatarURL: {
        type: String,
        required: true,
      },
      token: String,
      verify: {
        type: Boolean,
        default: false,
      },
      verificationToken: {
        type: String,
        required: [true, 'Verify token is required'],
      },
      inviter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      team: {
        type: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User',
          }
        ],
      },
      donats: {
        type: [
          {
            type: Schema.Types.ObjectId,
            ref: 'Payment',
          }
        ],
      },
      bonusAccount: {
        type: Number,
        default: 0,
      },
      historyBonusAccount: {
        type: [
          {
            initialBalance: {
              type: Number,
            },
            finalBalance: {
              type: Number,
            },
            amountTransaction: {
              type: Number,
            },
            dateTransaction: {
              type: Number,
              default: Date.now
            },
            comment: {
              type: String,
              enum: ["бонус", "приз", "вивід"],
            },
            levelBonus: {
              type: Number,
            },
            emailPartner: {
              type: String,
            },
          }
        ]
      },
}, {versionKey: false, timestamps: true});

userSchema.post('save', handleMongooseError);

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(30).pattern(nameRegexp).required(),
    password: Joi.string().min(6).max(30).pattern(passwordRegex).required(),
    email: Joi.string().pattern(emailRegexp).required(),
    inviterId: Joi.string(),
});

const emailSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
});

const loginSchema = Joi.object({
  password: Joi.string().min(6).max(30).required(),
  email: Joi.string().pattern(emailRegexp).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("user", "admin").required(),
});

// const startDateSchema = Joi.object({
//   startDate: Joi.date().required(),
// });

const schemas = {
    registerSchema,
    loginSchema,
    updateStatusSchema,
    emailSchema,
    // startDateSchema,
};

const User = model('User', userSchema);

module.exports = {User, schemas};