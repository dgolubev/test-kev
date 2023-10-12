import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { map, Observable } from 'rxjs';
import {
  ExchangeRateInput,
  ExchangeRateResponse,
  URL,
} from './exchange-rate.dto';

@Injectable()
export class ExchangeRateService {
  constructor(private httpService: HttpService) {}

  convertCurrency(input: ExchangeRateInput): Observable<ExchangeRateResponse> {
    return this.httpService
      .get(URL.exchangeRateConvertUrl.replace('{date}', input.date))
      .pipe(
        map((axiosResponse: AxiosResponse) => {
          return axiosResponse.data?.rates;
        }),
      );
  }
}
