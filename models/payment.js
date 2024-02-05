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
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
                levelPartner: {
                    type: Number,
                },
                levelBonus: {
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
    comment: Joi.string().max(30),
});

const schemas = {
    donatSchema,
};

const Payment = model('Payment', paymentSchema);

module.exports = {Payment, schemas};