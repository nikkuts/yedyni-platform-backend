const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const { emailRegexp, dateRegexp, stringRegexp, phoneRegexp } = require("../utils");

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
}, {versionKey: false, timestamps: true});

userSchema.post('save', handleMongooseError);

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(30).pattern(stringRegexp).required(),
    password: Joi.string().min(6).max(30).required(),
    email: Joi.string().pattern(emailRegexp).required(),
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
})

const schemas = {
    registerSchema,
    loginSchema,
    updateStatusSchema,
    emailSchema,
};

const User = model('user', userSchema);

module.exports = {User, schemas};