const mongoose = require('mongoose');
const app = require('./app');

const { DB_HOST, PORT = 3000 } = process.env;

mongoose.set('strictQuery', true);
mongoose.Promise = global.Promise;

const mongoUri = process.env.NODE_ENV === 'test' ? 'mongodb://localhost/testdb' : DB_HOST;

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Database connection successful');
    app.listen(PORT);
  })
  .catch(error => {
    console.log(error.message);
    process.exit(1);
  });