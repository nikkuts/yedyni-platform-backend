const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const paymentSchema = new Schema({
    data: {
        type: Schema.Types.Object,
        required: true,
    },
    fees: {
        type: [
            {
                userId: {
                    type: String,
                },
                levelPartner: {
                    type: Number,
                },
                levelSupport: {
                    type: Number,
                },
                fee: {
                    type: Number,
                },
            }
        ],
    },
}, {versionKey: false, timestamps: true});

paymentSchema.post('save', handleMongooseError);

const donatSchema = Joi.object({
    amount: Joi.number().multiple(40).required(),
});

const schemas = {
    donatSchema,
};

const Payment = model('Payment', paymentSchema);

module.exports = {Payment, schemas};