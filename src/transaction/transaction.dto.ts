export class TransactionInput {
  date: string;
  amount: string;
  currency: string;
  client_id: number;
}

export enum Currency {
  EUR = 'EUR',
}

export enum DiscountRuleForClientById {
  client_42 = 0.05,
}

export enum DefaultCommissionPercentage {
  percentage = 0.5,
}

export enum DefaultCommissionAmount {
  amount = 0.05,
}

export enum HighTurnoverDiscount {
  amount = 0.03,
}
