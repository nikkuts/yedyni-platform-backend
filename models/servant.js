const { Schema, model } = require('mongoose');
// const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const servantSchema = new Schema({
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      payment: {
        type: Schema.Types.Object,
        default: {},
      }
}, {versionKey: false, timestamps: true});

servantSchema.post('save', handleMongooseError);

const Servant = model('Servant', servantSchema);

module.exports = {Servant};