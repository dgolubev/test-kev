import { Test, TestingModule } from '@nestjs/testing';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { TransactionController } from './transaction.controller';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { TransactionService } from './transaction.service';
import { TransactionInput } from './transaction.dto';

const { expect } = chai;
chai.use(chaiAsPromised);

describe('TransactionController Unit Tests', () => {
  let transactionController: TransactionController;

  beforeAll(async () => {
    const TransactionServiceProvider = {
      provide: TransactionService,
      useFactory: () => ({
        insertOne: jest.fn(() => Promise.reject(new Error("DatabaseNotReachable"))),
        findByClientIdWithinActualMonth: jest.fn((clientId) => {
          if (clientId === 42) {
            return [{base_amount: 1500}];
          }
          return [];
        }),
      }),
    };

    const ExchangeRateServiceProviderForUsd = {
      provide: ExchangeRateService,
      useFactory: () => ({
        convertCurrency: jest.fn(({ amount }) => ({
          subscribe: ({ next }) => next({ USD: 1.2 }),
        })),
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        TransactionService,
        TransactionServiceProvider,
        ExchangeRateServiceProviderForUsd,
      ],
    }).compile();

    transactionController = app.get<TransactionController>(
      TransactionController,
    );
  });

  it('calling commission method correct result should be got', async () => {
    const mockTransactionInput: TransactionInput = {
      date: '2021-01-05',
      amount: '1000.00',
      currency: 'EUR',
      client_id: 1,
    };

    const result = await transactionController.commission(mockTransactionInput);

    expect(result).to.eql(
        JSON.stringify({
          amount: parseFloat('5.00').toFixed(2),
          currency: 'EUR',
        }),
    );
  });

  it('calling applyRules method minimum result of applied rules should be got', async () => {
    const mockTransactionInput: TransactionInput = {
      date: '2021-01-05',
      amount: '1000.00',
      currency: 'EUR',
      client_id: 1,
    };

    const result = await transactionController.applyRules(
        [transactionController.discountRule, transactionController.turnoverRule],
        mockTransactionInput,
    );

    expect(result).to.eql(5);
  });

  it('calling commission method correct commission should be got', async () => {
    const mockTransactionInput: TransactionInput = {
      date: '2021-01-05',
      amount: '1000.00',
      currency: 'USD',
      client_id: 1,
    };

    const result = await transactionController.commission(
        mockTransactionInput,
    );

    expect(result).to.eql("{\"amount\":\"4.17\",\"currency\":\"EUR\"}");
  });

});
