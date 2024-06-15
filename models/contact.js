const { Schema, model } = require('mongoose');
// const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const contactSchema = new Schema({
      first_name: {
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
      vik: {
        type: Number,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      work: {
        type: String,
        required: true,
      },
      mova: {
        type: String,
      },
      volonter: {
        type: String,
      },
      goal: {
        type: String,
      },
      level: {
        type: String,
      },
      kurs: {
        type: String,
      },
      kurs_ended: {
        type: String,
        required: true,
      },
      registration: {
        type: [
          {
            type: String,
            enum: [
              "kurs_perehodu", 
              "gramatichniy_kurs", 
              "kurs_z_pidgotovki_do_derzhispitu", 
              "kurs_vidnokolo"
            ], 
          }
        ]
      },
      contactUspacyId: {
        type: String,
      },
      dealUspacyId: {
        type: String,
      }
}, {versionKey: false, timestamps: true});

contactSchema.post('save', handleMongooseError);

const Contact = model('Contact', contactSchema);

module.exports = {Contact};