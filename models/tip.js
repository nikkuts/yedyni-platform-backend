const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const tipSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  }
}, {versionKey: false, timestamps: false});

tipSchema.post('save', handleMongooseError);

const Tip = model('Tip', tipSchema);

module.exports = { Tip };
