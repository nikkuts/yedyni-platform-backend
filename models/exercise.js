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
    default: '',
  },
  fileURL: {
    type: String,
    default: '',
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  comments: {
    type: [
      {
        date: {
          type: Number,
          default: Date.now
        },
        author: {
          type: String,
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
      }
    ]
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

const addCommentSchema = Joi.object({
  courseId: Joi.string().required(),
  lessonId: Joi.string().required(),
  author: Joi.string().required(),
  comment: Joi.string().max(300).required(),
  commentId: Joi.string(),
});

// const deleteCommentSchema = Joi.object({
//   courseId: Joi.string().required(),
//   lessonId: Joi.string().required(),
//   commentId: Joi.string(),
// });

const schemas = {
    addExerciseSchema,
    deleteFileSchema,
    addCommentSchema,
    // deleteCommentSchema,
};

const Exercises = model('Exercise', exerciseSchema);

module.exports = {Exercises, schemas};