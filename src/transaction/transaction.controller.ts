import { Controller, Post, UsePipes, Body } from '@nestjs/common';
import { ExchangeRateService } from 'src/exchange-rate/exchange-rate.service';
import { TransactionService } from './transaction.service';
import { transactionBodySchema } from './transaction.validation';
import { BodyValidationPipe } from '../pipes/body.validation.pipe';
import {
  Currency,
  TransactionInput,
  DiscountRuleForClientById,
  DefaultCommissionPercentage,
  DefaultCommissionAmount,
  HighTurnoverDiscount,
} from './transaction.dto';

@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  @Post()
  @UsePipes(new BodyValidationPipe(transactionBodySchema))
  async commission(
    @Body() transactionInput: TransactionInput,
  ): Promise<string> {
    return JSON.stringify({
      amount:
        transactionInput.currency !== Currency.EUR
          ? parseFloat(
              await this.getAmountWithExchange(transactionInput),
            ).toFixed(2)
          : parseFloat(
              await this.getAmountWithoutExchange(transactionInput),
            ).toFixed(2),
      currency: Currency.EUR,
    });
  }

  getClientDeposit = async (transactionInput: TransactionInput) => {
    try {
      const deposit =
        await this.transactionService.findByClientIdWithinActualMonth(
          transactionInput.client_id,
        );

      if (deposit) {
        const initialDeposit = 0;
        const totalDeposit = (await deposit).reduce(
          (prevAmmount, transactionAmmount) =>
            prevAmmount + transactionAmmount.base_amount,
          initialDeposit,
        );

        return totalDeposit;
      }
    } catch (error) {
      console.log(error);
    }
    return 0;
  };

  turnoverRule = async (transactionInput: TransactionInput) => {
    try {
      const clientDeposit = await this.getClientDeposit(transactionInput);
      if (clientDeposit) {
        return clientDeposit > 1000 ? HighTurnoverDiscount.amount : false;
      }
    } catch (error) {
      console.log(error);
    }
  };

  discountRule(transactionInput: TransactionInput) {
    return transactionInput.client_id === 42
      ? DiscountRuleForClientById.client_42
      : false;
  }

  defaultRule(transactionInput: TransactionInput) {
    const commissionAmount =
      (parseInt(transactionInput.amount) / 100) *
      DefaultCommissionPercentage.percentage;
    return commissionAmount < DefaultCommissionAmount.amount
      ? DefaultCommissionAmount.amount
      : commissionAmount;
  }

  async applyRules(
    rules: ((transactionInput: TransactionInput) => any)[],
    transactionInput: TransactionInput,
  ) {
    let commissionAmount;
    for (let i = 0; i < rules.length; i++) {
      const ruleResult = await rules[i](transactionInput);
      if (ruleResult) {
        commissionAmount = ruleResult;
        break;
      } else {
        continue;
      }
    }
    return commissionAmount
      ? commissionAmount
      : this.defaultRule(transactionInput);
  }

  getAmountWithExchange(transactionInput: TransactionInput) {
    const commissionAmount = this.applyRules(
      [this.turnoverRule, this.discountRule],
      transactionInput,
    );

    const exhangeRateInput = {
      date: transactionInput.date,
    };

    try {
      this.exchangeRateService.convertCurrency(exhangeRateInput).subscribe({
        next: async (exchangeRateResponse) => {
          this.transactionService.insertOne({
            date: transactionInput.date,
            amount: parseInt(transactionInput.amount),
            currency: transactionInput.currency,
            client_id: transactionInput.client_id,
            commission: await commissionAmount,
            base_currency: Currency.EUR,
            base_amount: parseInt(transactionInput.amount) * exchangeRateResponse[transactionInput.currency],
          });
        },
        error: (error) => {
          console.log(error);
        },
      });
    } catch (error) {
      console.log(error);
    }

    return commissionAmount;
  }

  async getAmountWithoutExchange(transactionInput: TransactionInput) {
    const commissionAmount = await this.applyRules(
      [this.turnoverRule, this.discountRule],
      transactionInput,
    );
    try {
      this.transactionService.insertOne({
        date: transactionInput.date,
        amount: parseInt(transactionInput.amount),
        currency: transactionInput.currency,
        client_id: transactionInput.client_id,
        commission: commissionAmount,
        base_currency: Currency.EUR,
        base_amount: parseInt(transactionInput.amount),
      });
    } catch (error) {
      console.log(error);
      throw error;
    }

    return commissionAmount;
  }
}
