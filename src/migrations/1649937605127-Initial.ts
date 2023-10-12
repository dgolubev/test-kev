import {MigrationInterface, QueryRunner} from "typeorm";

export class Initial1649937605127 implements MigrationInterface {
    name = 'Initial1649937605127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`transaction\` (\`id\` int NOT NULL AUTO_INCREMENT, \`amount\` int NOT NULL, \`currency\` varchar(255) NOT NULL, \`client_id\` int NOT NULL, \`date\` varchar(255) NOT NULL, \`commission\` int NOT NULL, \`base_currency\` varchar(255) NOT NULL, \`base_amount\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`transaction\``);
    }

}
