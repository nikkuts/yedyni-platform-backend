const { Schema, model } = require('mongoose');
const {handleMongooseError} = require('../helpers');

const contactSchema = new Schema({
      first_name: {
        type: String,
        required: true,
      },
      last_name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
      },
      registration: {
        type: [
          {
            type: String,
            enum: [
              "kurs_perehodu", 
              "gramatichniy_kurs",
              "kurs_z_pidgotovki_do_derzhispitu",
              "kurs_vidnokolo",
              "kurs_proukrayinska_new",
              "7_ekspres_urokiv_dilovoyi_ukrayinskoyi_movi"
            ], 
          }
        ]
      },
      contactUspacyId: {
        type: String,
      }
}, {versionKey: false, timestamps: true});

contactSchema.post('save', function(error, doc, next) {
  handleMongooseError(error, doc, next);
});

const Contact = model('Contact', contactSchema);

module.exports = {Contact};