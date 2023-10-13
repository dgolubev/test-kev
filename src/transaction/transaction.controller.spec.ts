import {
  Test,
  TestingModule,
} from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { TransactionService } from './transaction.service';
import {
  CommissionByClient,
  Currency,
  DefaultCommissionAmount,
  HighTurnoverDiscount,
  TransactionInput,
} from './transaction.dto';
import { ExchangeData } from '@app/exchange-rate/exchange-rate.dto';

describe('TransactionController Unit Tests', () => {
  const dummyClientIdSimple = 10;
  const dummyClientId1KTurnover = 11;
  const dummyClientIdWithDiscount = 42;
  const dummyClientId1KTurnoverAndSmallDiscount = 52;
  const dummyClientId1KTurnoverAndBigDiscount = 62;

  const convertedAmount = '888.88';

  let sut: TransactionController;

  const mockGetAmountByMonthByClient = jest.fn();
  const mockInsertOne = jest.fn();
  const mockConvertToCurrency = jest.fn((data: ExchangeData) => {
    return convertedAmount;
  })

  beforeAll(async () => {
    //   mocking console to prevent console messages in test result
    console.log = jest.fn();

    const TransactionServiceProvider = {
      provide: TransactionService,
      useFactory: () => ({
        insertOne: mockInsertOne,
        getAmountByMonthByClient: mockGetAmountByMonthByClient,
        findByClientIdWithinActualMonth: jest.fn(),
      }),
    };

    const ExchangeRateServiceProviderForUsd = {
      provide: ExchangeRateService,
      useFactory: () => ({
        convertToCurrency: mockConvertToCurrency,
        convertCurrency: jest.fn(),
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

    //  SUT - Subject Under Test
    sut = app.get<TransactionController>(
      TransactionController,
    );
  });

  afterAll(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it('get transation amount in base currency', async () => {
    const mockTransactionInput: TransactionInput = {
      date: '2021-01-05',
      amount: '999.00',
      currency: 'USD',
      client_id: dummyClientIdSimple,
    };

    const result = await sut.getTransactionAmountInBaseCurrency(mockTransactionInput);

    expect(mockConvertToCurrency).toBeCalledTimes(1);
    expect(mockConvertToCurrency).toBeCalledWith({
      date: mockTransactionInput.date,
      from: mockTransactionInput.currency,
      to: Currency.EUR,
      amount: mockTransactionInput.amount,
    });
    expect(result).toBe(convertedAmount);
  });

  describe('calculate commission amount: ', () => {
    it('client does not have discount and turnover < 1K, then get default commission', async () => {
      mockGetAmountByMonthByClient.mockImplementationOnce(() => 10);
      // getMockImplementation(() => 10);

      const mockTransactionInput: TransactionInput = {
        date: '2021-01-05',
        amount: '10.00',
        currency: 'EUR',
        client_id: dummyClientIdSimple,
      };

      const result = await sut.getCommissionAmount(
        mockTransactionInput,
      );

      expect(result).toEqual(DefaultCommissionAmount.amount);
    });

    it('client has discount and turnover < 1K, then get client specific commission', async () => {
      mockGetAmountByMonthByClient.mockImplementationOnce(() => 999);

      const mockTransactionInput: TransactionInput = {
        date: '2021-01-05',
        amount: '10.00',
        currency: 'EUR',
        client_id: dummyClientIdWithDiscount,
      };

      const result = await sut.getCommissionAmount(
        mockTransactionInput,
      );

      expect(result).toEqual(CommissionByClient[dummyClientIdWithDiscount]);
    });

    it('client does not have discount, but reach 1000 turnover, then get high turnover discount', async () => {
      mockGetAmountByMonthByClient.mockImplementationOnce(() => 1000);

      const mockTransactionInput: TransactionInput = {
        date: '2021-01-05',
        amount: '10.00',
        currency: 'EUR',
        client_id: dummyClientId1KTurnover,
      };

      const result = await sut.getCommissionAmount(
        mockTransactionInput,
      );

      expect(result).toBe(HighTurnoverDiscount.amount);
    });

    it(`client reach 1K turnover and have discount, but bigger then high turnover discount, 
      then get high turnover discount`,
      async () => {
        mockGetAmountByMonthByClient.mockImplementationOnce(() => 1000);

        const mockTransactionInput: TransactionInput = {
          date: '2021-01-05',
          amount: '10.00',
          currency: 'EUR',
          client_id: dummyClientId1KTurnoverAndSmallDiscount,
        };

        const result = await sut.getCommissionAmount(
          mockTransactionInput,
        );

        expect(result).toBe(HighTurnoverDiscount.amount);
      },
    );

    it(`client reach 1K turnover and have discount, but smaller then high turnover discount, 
      then get client discount`,
      async () => {
        mockGetAmountByMonthByClient.mockImplementationOnce(() => 1000);

        const mockTransactionInput: TransactionInput = {
          date: '2021-01-05',
          amount: '10.00',
          currency: 'EUR',
          client_id: dummyClientId1KTurnoverAndBigDiscount,
        };

        const result = await sut.getCommissionAmount(
          mockTransactionInput,
        );

        expect(result).toBe(CommissionByClient[dummyClientId1KTurnoverAndBigDiscount]);
      },
    );
  })

  describe('Save Transaction', () => {
    it('saving failed', async () => {
      const mockTransactionInput = {} as TransactionInput;
      const commission = 9999.99;
      const amountInBaseCurr = 8888.88;

      const expectError = new Error('Dymmy Text');
      mockInsertOne.mockImplementationOnce(() => {
        throw expectError;
      });

      try {
        await sut.saveTransaction(
          mockTransactionInput,
          commission,
          amountInBaseCurr,
        );
        expect(true).toBe('Error should be throw');
      } catch (err) {
        expect(err).toBe(expectError);
      }

      expect(mockInsertOne).toBeCalledTimes(1);
    });

    it('saved successful', async () => {
      const mockTransactionInput: TransactionInput = {
        date: '2021-01-05',
        amount: '1000.00',
        currency: 'EUR',
        client_id: 1,
      };

      const commission = 9999.99
      const amountInBaseCurr = 8888.88

      mockInsertOne.mockReset().mockImplementationOnce(jest.fn());

      await sut.saveTransaction(
        mockTransactionInput,
        commission,
        amountInBaseCurr,
      );

      expect(mockInsertOne).toBeCalledTimes(1);
      expect(mockInsertOne).toBeCalledWith(expect.objectContaining({
        date: mockTransactionInput.date,
        amount: 1000.00,
        currency: mockTransactionInput.currency,
        client_id: mockTransactionInput.client_id,
        commission: commission,
        base_currency: Currency.EUR,
        base_amount: amountInBaseCurr,
      }));
    });
  })

  it('calling commission method correct result should be got', async () => {
    const mockTransactionInput: TransactionInput = {
      date: '2021-01-05',
      amount: '1000.00',
      currency: 'EUR',
      client_id: 1,
    };

    const commission = 9999.99;
    const amountInBaseCurr = '8888.88';

    //  mocking inner functions
    sut.getCommissionAmount = async () => commission;
    sut.getTransactionAmountInBaseCurrency = async () => amountInBaseCurr;
    sut.saveTransaction = jest.fn();

    // mockGetAmountByMonthByClient.mockImplementationOnce(() => 10);

    const result = await sut.commission(mockTransactionInput);

    expect(result).toBe(
      JSON.stringify({
        amount: commission.toFixed(2),
        currency: Currency.EUR,
      }),
    );
  });
});
