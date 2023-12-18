const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const paymentSchema = new Schema({
    amount: {
        type: Number,
        required: [true, 'Сума повинна бути кратною 40'],
      }
}, {versionKey: false, timestamps: true});

paymentSchema.post('save', handleMongooseError);

const donatSchema = Joi.object({
    amount: Joi.number().multiple(40).required(),
});

const schemas = {
    donatSchema,
};

const Payment = model('payment', paymentSchema);

module.exports = {Payment, schemas};