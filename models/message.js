const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const messageSchema = new Schema({
  chat: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    maxlength: 500,
    required: true,
  },
  fileURL: {
    type: String,
    default: '',
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Number,
    default: Date.now
  },
}, {versionKey: false, timestamps: true});

messageSchema.post('save', handleMongooseError);

const addMessageSchema = Joi.object({
  chat: Joi.string().required(),
  text: Joi.string().max(500).required(),
});

const updateMessageSchema = Joi.object({
  messageId: Joi.string().required(),
  text: Joi.string().max(500).required(),
});

const deleteFileSchema = Joi.object({
  messageId: Joi.string().required(),
  fileURL: Joi.string().required().not().empty(),
});

const deleteMessageSchema = Joi.object({
  messageId: Joi.string().required(),
});

const schemas = {
    addMessageSchema,
    updateMessageSchema,
    deleteFileSchema,
    deleteMessageSchema,
};

const Message = model('Message', messageSchema);

module.exports = {Message, schemas};