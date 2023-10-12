export enum URL {
  exchangeRateConvertUrl = 'https://api.exchangerate.host/{date}',
}

export type ExchangeRateInput = {
  date: string;
};

export type ExchangeRateResponse = {
  motd: {
    msg: string;
    url: string;
  };
  success: true;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    rate: number;
  };
  historical: boolean;
  date: string;
  result: number;
};
