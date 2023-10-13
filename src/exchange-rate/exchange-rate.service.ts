import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import {
  map,
  Observable,
} from 'rxjs';
import {
  ExchangeData,
  ExchangeRateInput,
  ExchangeRateResponse,
  RemoteEndpoints,
} from './exchange-rate.dto';

@Injectable()
export class ExchangeRateService {
  constructor(private httpService: HttpService) {
  }

  convertCurrency(input: ExchangeRateInput): Observable<ExchangeRateResponse> {
    return this.httpService
      .get(RemoteEndpoints.exchangeRateConvertUrl.replace('{date}', input.date))
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          return axiosResponse.data?.rates;
        }),
      );
  }

  async convertToCurrency(input: ExchangeData): Promise<string> {
    const url = new URL(RemoteEndpoints.exchangeAmountUrl);
    url.searchParams.append('access_key', 'd83019200f2ae292ee835a77602a04ee');
    const searchParams = new URLSearchParams(input);

    const res = await this.httpService
      .axiosRef
      .get(url.toString() + '&' + searchParams.toString());

    return res.data.result;
  }
}
