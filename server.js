require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const initializeSocket = require('./helpers/socket');

const { NODE_ENV, DB_HOST, PORT = 3000 } = process.env;

const dns = require("dns");

if (
  NODE_ENV !== "production" &&
  dns.getServers().includes("127.0.0.1")
) {
  console.warn("Local DNS resolver detected. Switching to Google DNS.");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

mongoose.set('strictQuery', true);
mongoose.Promise = global.Promise;

mongoose.connect(DB_HOST)
  .then(() => {
    console.log('Database connection successful');

    // Створення HTTP сервера з використанням Express додатку
    const server = http.createServer(app);

    // 🔥 Обробка критичних помилок порту
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} already in use`);
        process.exit(1);
      }
    });

    // Ініціалізація Socket.io через зовнішню функцію
    initializeSocket(server);

    // Запуск серверу
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.log(error.message);
    process.exit(1);
  });


// const mongoose = require('mongoose');
// const app = require('./app');

// const { DB_HOST, PORT = 3000 } = process.env;

// mongoose.set('strictQuery', true);
// mongoose.Promise = global.Promise;

// // const mongoUri = process.env.NODE_ENV === 'test' ? 'mongodb://localhost/testdb' : DB_HOST;

// mongoose.connect(DB_HOST)
//   .then(() => {
//     console.log('Database connection successful');
//     app.listen(PORT);
//   })
//   .catch(error => {
//     console.log(error.message);
//     process.exit(1);
//   });