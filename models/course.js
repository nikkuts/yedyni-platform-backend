const { Schema, model } = require('mongoose');
const Joi = require('joi');
const {handleMongooseError} = require('../helpers');

const courseSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  wave: {
    type: String,
    required: true,
  },
  start: {
    type: String,
    required: true,
  },
  canal: {
    type: String,
  },
  viber: {
    type: String,
  },
  chat: {
    type: String,
  },
  nextWave: {
    type: String,
  },
  nextStart: {
    type: String,
  },
  nextCanal: {
    type: String,
  },
  nextViber: {
    type: String,
  },
  nextChat: {
    type: String,
  },
  addedNextWave: {
    type: Date,
  },
  lessons: {
    type: [
      {
        day: {
            type: String,
        },
        theme: {
            type: String,
        },
        image: {
            type: String,
        },
        content: {
            type: String,
        },
        theory: {
            type: String,
        },
        practice: {
            type: String,
        },
        audio: {
            type: [String],
            default: [],
        },
        video: {
          type: [
            {
              title: String,
              url: String,
            }
          ],
          default: [],
        },
        test: {
            type: String,
        },
        diary: {
            type: String,
        },
        scheduledDate: {
            type: Date,
        }
      }
    ]
  },
  registration: {
    type: String,
  },
  funnelId: {
    type: Number,
  },
  welcomeStageId: {
    type: Number,
  },
  paymentStageId: {
    type: Number,
  },
  welcome: {
    type: String,
  },
  amount: {
    type: Number,
  },
  discountPercentage: {
    type: Number,
  },
  promoCode: {
    type: String,
  }
}, {versionKey: false, timestamps: true});

courseSchema.post('save', handleMongooseError);

const updateNextWaveSchema = Joi.object({
  courseId: Joi.string().required(),
  nextWave: Joi.string().required(),
  nextStart: Joi.string().required(),
  nextCanal: Joi.string().required(),
  nextViber: Joi.string(),
  nextChat: Joi.string(),
});

const schemas = {
    updateNextWaveSchema,
};

const Course = model('Course', courseSchema);

module.exports = {Course, schemas};