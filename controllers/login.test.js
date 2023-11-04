const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
const {login} = require('./auth');

app.post("/api/auth/login", login);

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
const testUser = { email: 'testuser@t.ua', password: '123456' };

describe('test login controller', () => {

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  
    const hasPassword = await bcrypt.hash(testUser.password, 10);
    const newTestUser = {...testUser, password: hasPassword};
    await mongoose.connection.collection('users').insertOne(newTestUser);
  });
        
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
    
    test('Returns a status of 200 in the response', async () => {
      const response = await request(app).post('/api/auth/login').send(testUser);
      expect(response.status).toBe(200);
    });

    test('a valid token is returned in the response', async () => {
      const response = await request(app).post('/api/auth/login').send(testUser);
      expect(response.body.token).toBeDefined();

      const decodedToken = jwt.decode(response.body.token);
      expect(decodedToken).not.toBeNull();
      expect(decodedToken.id).toBeDefined();

      const {SECRET_KEY} = process.env; 
      const decodedTokenWithSecret = jwt.verify(response.body.token, SECRET_KEY);
      expect(decodedTokenWithSecret).toBeTruthy();
    });

    test(`An object 'user' with the fields 'email' and 'subscription' in the response is returned`, async () => {
      const response = await request(app).post('/api/auth/login').send(testUser);
      expect(response.body.user).toBeDefined();
      expect(response.body.user).toMatchObject({
        email: expect.any(String),
        subscription: expect.any(String),
      });
    });
});