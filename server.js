// const mongoose = require('mongoose');
// const http = require('http');
// const app = require('./app');
// const initializeSocket = require('./helpers/socket');

// const { DB_HOST, PORT = 3000 } = process.env;

// mongoose.set('strictQuery', true);
// mongoose.Promise = global.Promise;

// mongoose.connect(DB_HOST)
//   .then(() => {
//     console.log('Database connection successful');

//     // Створення HTTP сервера з використанням Express додатку
//     const server = http.createServer(app);

//     // Ініціалізація Socket.io через зовнішню функцію
//     initializeSocket(server);

//     // Запуск серверу
//     server.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   })
//   .catch(error => {
//     console.log(error.message);
//     process.exit(1);
//   });


const mongoose = require('mongoose');
const app = require('./app');

const { DB_HOST, PORT = 3000 } = process.env;

mongoose.set('strictQuery', true);
mongoose.Promise = global.Promise;

// const mongoUri = process.env.NODE_ENV === 'test' ? 'mongodb://localhost/testdb' : DB_HOST;

mongoose.connect(DB_HOST)
  .then(() => {
    console.log('Database connection successful');
    app.listen(PORT);
  })
  .catch(error => {
    console.log(error.message);
    process.exit(1);
  });