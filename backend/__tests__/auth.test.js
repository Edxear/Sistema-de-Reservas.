const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
jest.mock('../config/db', () => jest.fn(async () => {}));

const app = require('../server');

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe('Auth validations', () => {
  it('should return 400 when register data is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'invalid' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(expect.any(Array));
  });

  it('should return 400 when login payload is missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toEqual(expect.any(Array));
  });
});