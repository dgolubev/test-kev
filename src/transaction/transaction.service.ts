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

  async findByClientIdWithinActualMonth(clientId): Promise<Transaction[]> {
    return this.transactionRepository.query(
      `SELECT amount,commission,currency,client_id,base_amount FROM tryout_backend.transaction WHERE client_id = ${clientId} and 
      MONTH(date) = MONTH(CURRENT_DATE())AND YEAR(date) = YEAR(CURRENT_DATE())`,
    );
  }
}
