import {
  Module,
  NestModule,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { LoggerMiddleware } from 'src/middlewares/logger.middleware';
import { Transaction } from './transaction.entity';
import { ExchangeRateModule } from './../exchange-rate/exchange-rate.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), ExchangeRateModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'transaction', method: RequestMethod.POST });
  }
}
