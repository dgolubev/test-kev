import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async insertOne(transaction: Transaction): Promise<Transaction> {
    return this.transactionRepository.save(transaction);
  }

  async getAmountByMonthByClient(clientId): Promise<number> {
    const record = await this.transactionRepository
      .createQueryBuilder('t')
      .select('SUM(t.base_amount)', 'totalAmount')
      .where(
        `client_id = :clientId
        AND MONTH(date) = MONTH(CURRENT_DATE())
        AND YEAR(date) = YEAR(CURRENT_DATE())`,
        {
          clientId,
        }
      )
      .getRawOne();

    return record.totalAmount ?? 0;
  }
}
