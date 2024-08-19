const socketIo = require('socket.io');
const checkAndSaveMessage = require('./checkAndSaveMessage.js')

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://platform.yedyni.org',
      ], 
      transports: ['websocket'], // Використовуємо тільки WebSocket для підключень
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('message', async (msg) => {
      try {
        // Перевіряємо і зберігаємо повідомлення
        const newMessage = await checkAndSaveMessage(msg);

        // Відправляємо збережене повідомлення всім клієнтам
        io.emit('message', newMessage);

        // Виклик зворотного виклику з відповіддю відправнику
        // callback(newMessage);
      } catch (error) {
        console.error('Error processing message:', error.message);
        // Надсилаємо помилку відправнику
        socket.emit('error', { message: error.message });
        // callback({error: error.message});
      }
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
};

module.exports = initializeSocket;
