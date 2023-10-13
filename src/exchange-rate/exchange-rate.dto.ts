export enum RemoteEndpoints {
  exchangeAmountUrl = 'http://api.exchangerate.host/convert',
  exchangeRateConvertUrl = 'https://api.exchangerate.host/{date}',
}

export type ExchangeRateInput = {
  date: string;
};

export type ExchangeData = {
  date: string;
  from: string;
  to: string;
  amount: string;
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
