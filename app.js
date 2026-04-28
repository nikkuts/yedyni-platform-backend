const express = require('express')
const logger = require('morgan')
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const { updateCurrentWaveCourses } = require('./utils');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const authRouter = require('./routes/api/auth')
const partnersRouter = require('./routes/api/partners')
const paymentsRouter = require('./routes/api/payments')
const coursesRouter = require('./routes/api/courses')
const exercisesRouter = require('./routes/api/exercises')
const diaryRouter = require('./routes/api/diary')
const contactsRouter = require('./routes/api/contacts')
const chatsRouter = require('./routes/api/chats')
const canalsRouter = require('./routes/api/canals')

const app = express()

app.set('trust proxy', 1);

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short'

app.use(logger(formatsLogger))

const allowedOrigins = [
  'platform.yedyni.org',
  'yedyni.org',
  'www.liqpay.ua',
  'yedyni.uspacy.ua',
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((host) => {
        try {
          return new URL(origin).hostname === host;
        } catch {
          return false;
        }
      });

      if (isAllowed) {
        return callback(null, origin);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options("*", cors());

app.use(express.json())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.text({ type: 'text/plain' }));

app.use('/api/auth', authRouter)
app.use('/api/partners', partnersRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/exercises', exercisesRouter)
app.use('/api/diary', diaryRouter)
app.use('/api/contacts', contactsRouter)
app.use('/api/chats', chatsRouter)
app.use('/api/canals', canalsRouter)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  const {status = 500, message = 'Server error'} = err;
  res.status(status).json({ message })
})

updateCurrentWaveCourses()

module.exports = app
