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
    subscription: {
        type: {
            regular: {
                type: [
                    {
                      type: Schema.Types.ObjectId,
                      ref: 'Payment',
                    }
                ],
            },
            dateLastPayment: {
                type: Date,
            },
            status: {
                type: String,
                enum: ["cancelled"],
            },
        }
      },
}, {versionKey: false, timestamps: true});

paymentSchema.post('save', handleMongooseError);

const donatSchema = Joi.object({
    amount: Joi.number().multiple(40).required(),
    comment: Joi.string().max(30),
    subscribe: Joi.string().valid('1'),
});

const unsubscribeSchema = Joi.object({
    orderId: Joi.string().required(),
});

const schemas = {
    donatSchema,
    unsubscribeSchema,
};

const Payment = model('Payment', paymentSchema);

module.exports = {Payment, schemas};