const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const diarySchema = new Schema({
  courseId: {
    type: String,
    required: true,
  },
  lessonId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  test: {
    type: Number,
    integer: true,
    min: 0,
    max: 10,
    default: 0,
  },
  entry: {
    type: String,
    required: true,
  },
  plan: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
}, {versionKey: false, timestamps: true});

diarySchema.post('save', handleMongooseError);

const addDiarySchema = Joi.object({
  courseId: Joi.string().required(),
  lessonId: Joi.string().required(),
  date: Joi.string().required(),
  test: Joi.number().integer().min(0).max(10),
  entry: Joi.string().max(500).required(),
  plan: Joi.string().max(500).required(),
});

const schemas = {
    addDiarySchema,
};

const Diary = model('Diary', diarySchema);

module.exports = {Diary, schemas};