import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column()
  client_id: number;

  @Column()
  date: string;

  @Column()
  commission: number;

  @Column()
  base_currency: string;

  @Column()
  base_amount: number;
}
