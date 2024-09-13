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
  chat: {
    type: String,
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
  }
}, {versionKey: false, timestamps: true});

courseSchema.post('save', handleMongooseError);

const Course = model('Course', courseSchema);

module.exports = {Course};