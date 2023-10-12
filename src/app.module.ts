import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionModule } from './transaction/transaction.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';

@Module({
  imports: [TransactionModule, TypeOrmModule.forRoot(), ExchangeRateModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
