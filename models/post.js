const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const postSchema = new Schema({
  canal: {
    type: String,
    required: true,
  },
  publication: {
    type: String,
    maxlength: 5000,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Number,
    default: Date.now
  },
  likes: {
    type: Number,
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
          maxlength: 500,
          required: true,
        },
        sender: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        likes: {
          type: Number,
        },
      }
    ]
  }
}, {versionKey: false, timestamps: true});

postSchema.post('save', handleMongooseError);

const addPostSchema = Joi.object({
  canal: Joi.string().required(),
  publication: Joi.string().max(5000).required(),
});

const updatePostSchema = Joi.object({
  postId: Joi.string().required(),
  publication: Joi.string().max(5000),
  likes: Joi.number().integer().min(1),
});

const deletePostSchema = Joi.object({
  postId: Joi.string().required(),
});

const addCommentSchema = Joi.object({
  postId: Joi.string().required(),
  comment: Joi.string().max(500).required(),
});

const updateCommentSchema = Joi.object({
  postId: Joi.string().required(),
  commentId: Joi.string().required(),
  comment: Joi.string().max(500).required(),
});

const schemas = {
    addPostSchema,
    updatePostSchema,
    deletePostSchema,
    addCommentSchema,
    updateCommentSchema,
};

const Post = model('Post', postSchema);

module.exports = {Post, schemas};