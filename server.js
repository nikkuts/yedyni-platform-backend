const mongoose = require('mongoose');
const app = require('./app');

const { DB_HOST, PORT = 3000 } = process.env;
// const {DB_HOST} = require('./config');

mongoose.set('strictQuery', true);
mongoose.Promise = global.Promise;

// const mongoUri = process.env.NODE_ENV === 'test' ? 'mongodb://localhost/testdb' : DB_HOST;

mongoose.connect(DB_HOST)
  .then(() => {
    console.log('Database connection successful');
    app.listen(3000);
  })
  .catch(error => {
    console.log(error.message);
    process.exit(1);
  });