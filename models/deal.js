const { Schema, model } = require('mongoose');
const {handleMongooseError} = require('../helpers');

const dealSchema = new Schema({
      contact: {
        type: Schema.Types.ObjectId,
        ref: 'Contact',
        required: true,
      },
      title: {
        type: String,
        enum: [
          "Курс переходу",
          "Граматичний курс",
          "Курс з підготовки до держіспиту", 
          "Видноколо", 
          "Проукраїнська"
        ],
        required: true,
      },
      wave: {
        type: String,
        required: true,
      },
      promoCode: {
        type: String,
      },
      dealUspacyId: {
        type: String,
      },
      payment: {
        type: Schema.Types.Object,
        default: {},
      }
}, {versionKey: false, timestamps: true});

dealSchema.post('save', function(error, doc, next) {
  handleMongooseError(error, doc, next);
});

const Deal = model('Deal', dealSchema);

module.exports = {Deal};


// const clientSchema = new Schema({
//   first_name: {
//     type: String,
//     required: true,
//   },
//   last_name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//   },
//   phone: {
//     type: String,
//     required: true,
//   },
//   product: {
//     type: String,
//     enum: [
//       "Курс з підготовки до держіспиту", 
//       "Видноколо", 
//       "Проукраїнська"
//     ],
//     required: true,
//   },
//   payment: {
//     type: Schema.Types.Object,
//     default: {},
//   }
// }, {versionKey: false, timestamps: true});