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

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short'

app.use(logger(formatsLogger))
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://platform.yedyni.org',
    'https://yedyni.org',
    'https://www.liqpay.ua',
    'https://yedyni.uspacy.ua',
  ],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}))
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
