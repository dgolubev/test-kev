export class TransactionInput {
  date: string;
  amount: string;
  currency: string;
  client_id: number;
}

export enum Currency {
  EUR = 'EUR',
}

const CommissionByClient: Record<string, number> = {
  42: 0.05,
  52: 0.10,
  62: 0.02,
};

export enum DefaultCommissionPercentage {
  percentage = 0.5,
}

export enum DefaultCommissionAmount {
  amount = 0.05,
}

export enum HighTurnoverDiscount {
  amount = 0.03,
}

export {
  CommissionByClient,
}
