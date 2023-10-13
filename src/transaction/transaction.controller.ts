import {
  Body,
  Controller,
  Header,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ExchangeRateService } from '@app/exchange-rate/exchange-rate.service';
import { BodyValidationPipe } from '@app/pipes/body.validation.pipe';
import { TransactionService } from './transaction.service';
import { transactionBodySchema } from './transaction.validation';
import {
  CommissionByClient,
  Currency,
  DefaultCommissionAmount,
  DefaultCommissionPercentage,
  HighTurnoverDiscount,
  TransactionInput,
} from './transaction.dto';

@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {
  }

  @Post()
  @Header('Content-Type', 'application/json')
  @UsePipes(new BodyValidationPipe(transactionBodySchema))
  async commission(
    @Body() transactionInput: TransactionInput,
  ): Promise<string> {
    const commissionAmount = await this.getCommissionAmount(transactionInput);
    const transactionAmountInBaseCurr = await this.getTransactionAmountInBaseCurrency(transactionInput);

    await this.saveTransaction(
      transactionInput,
      commissionAmount,
      parseFloat(transactionAmountInBaseCurr),
    )

    return JSON.stringify({
      amount: commissionAmount.toFixed(2),
      currency: Currency.EUR,
    });
  }

  async turnoverRule(transactionInput: TransactionInput): Promise<number | boolean> {
    try {
      const clientDeposit = await this.getTotalAmount(transactionInput);
      if (clientDeposit >= 1000) {
        return HighTurnoverDiscount.amount;
      }
    } catch (error) {
      console.log(error);
    }

    return false;
  }

  async getTotalAmount(transactionInput: TransactionInput): Promise<number> {
    try {
      return await this.transactionService.getAmountByMonthByClient(
        transactionInput.client_id,
      ) ?? 0;
    } catch (error) {
      console.log(error);
    }

    return 0;
  }

  discountRule(transactionInput: TransactionInput): number | boolean {
    return CommissionByClient[transactionInput.client_id] ?? false;
  }

  defaultRule(transactionInput: TransactionInput): number {
    const commissionAmount =
      (parseFloat(transactionInput.amount) / 100) *
      DefaultCommissionPercentage.percentage;

    return Math.max(DefaultCommissionAmount.amount, commissionAmount);
  }

  async getCommissionAmount(transactionInput: TransactionInput): Promise<number> {
    const rules = [
      this.discountRule,
      this.turnoverRule,
    ];

    let commissionAmount;

    for (const rule of rules) {
      const ruleResult = await rule.call(this, transactionInput);
      if (ruleResult === false) {
        continue;
      }

      commissionAmount = commissionAmount
        ? Math.min(ruleResult as number, commissionAmount)
        : ruleResult;
    }

    return commissionAmount ?? this.defaultRule(transactionInput);
  }

  async getTransactionAmountInBaseCurrency(transactionInput: TransactionInput): Promise<string> {
    if (transactionInput.currency === Currency.EUR) {
      return transactionInput.amount;
    }

    const exhangeRateInput = {
      date: transactionInput.date,
      from: transactionInput.currency,
      to: Currency.EUR,
      amount: transactionInput.amount,
    };

    try {
      return await this.exchangeRateService.convertToCurrency(exhangeRateInput);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async saveTransaction(
    transactionInput: TransactionInput,
    commissionAmount: number,
    transactionAmountInBaseCurr: number,
  ): Promise<void> {
    const amount = parseInt(transactionInput.amount);

    try {
      await this.transactionService.insertOne({
        date: transactionInput.date,
        amount: amount,
        currency: transactionInput.currency,
        client_id: transactionInput.client_id,
        commission: commissionAmount,
        base_currency: Currency.EUR,
        base_amount: transactionAmountInBaseCurr,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
