const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const exerciseSchema = new Schema({
  courseId: {
    type: String,
    required: true,
  },
  lessonId: {
    type: String,
    required: true,
  },
  homework: {
    type: String,
    required: true,
  },
  fileURL: {
    type: String,
    default: '',
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
}, {versionKey: false, timestamps: true});

exerciseSchema.post('save', handleMongooseError);

const addExerciseSchema = Joi.object({
  courseId: Joi.string().required(),
  lessonId: Joi.string().required(),
  homework: Joi.string().max(3000).required(),
});

const deleteFileSchema = Joi.object({
  courseId: Joi.string().required(),
  lessonId: Joi.string().required(),
  fileURL: Joi.string().required().not().empty(),
});

const schemas = {
    addExerciseSchema,
    deleteFileSchema,
};

const Exercises = model('Exercise', exerciseSchema);

module.exports = {Exercises, schemas};