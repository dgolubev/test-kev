import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  afterAll(async () => {
    await app.close();
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/transaction (POST)', () => {
    return request(app.getHttpServer())
      .post('/transaction')
      .set('Content-type', 'application/json')
      .send({
        "date": "2023-10-11",
        "amount": "500.00",
        "currency": "USD",
        "client_id": 42
      })
      .expect(201)
      .expect({
        "amount": "0.03",
        "currency": "EUR"
      });
  });

});
