const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const exerciseSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  lessonId: {
    type: String,
    required: true,
  },
  homework: {
    type: String,
    default: '',
  },
  fileURL: {
    type: String,
    default: '',
  },
  fileType: {
    type: String,
    default: '',
  },
  fileName: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 12,
  },
  comments: {
    type: [
      {
        date: {
          type: Number,
          default: Date.now
        },
        comment: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["active", "inactive"],
        },
        author: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
         fileURL: {
          type: String,
          default: '',
        },
        fileType: {
          type: String,
          default: '',
        },
        fileName: {
          type: String,
          default: '',
        },
      }
    ]
  }
}, {versionKey: false, timestamps: true});

exerciseSchema.post('save', handleMongooseError);

const addExerciseSchema = Joi.object({
  courseId: Joi.string().required(),
  lessonId: Joi.string().required(),
  homework: Joi.string().max(30000).required(),
  originalname: Joi.string(),
});

const updateRatingSchema = Joi.object({
  exerciseId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(12).required(),
});

const updateExerciseSchema = Joi.object({
  exerciseId: Joi.string().required(),
  homework: Joi.string().max(30000).required(),
  originalname: Joi.string(),
});

const deleteFileSchema = Joi.object({
  exerciseId: Joi.string().required(),
  fileURL: Joi.string().required().not().empty(),
  commentId: Joi.string(),
});

const addCommentSchema = Joi.object({
  exerciseId: Joi.string().required(),
  comment: Joi.string()
    .allow("")
    .max(3000)
    .required(),
  fileName: Joi.string(),
});

const updateCommentSchema = Joi.object({
  exerciseId: Joi.string().required(),
  commentId: Joi.string().required(),
  comment: Joi.string()
    .allow("")
    .max(3000)
    .required(),
  fileName: Joi.string(),
  oldFileURL: Joi.string().allow(""),
});

const deleteCommentSchema = Joi.object({
  exerciseId: Joi.string().required(),
  commentId: Joi.string().required(),
  oldFileURL: Joi.string().allow(""),
});

const schemas = {
  addExerciseSchema,
  updateRatingSchema,
  updateExerciseSchema,
  deleteFileSchema,
  addCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
};

const Exercise = model('Exercise', exerciseSchema);

module.exports = {Exercise, schemas};