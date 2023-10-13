import { ConnectionOptions } from "typeorm";

const config: ConnectionOptions = {
  name: "default",
  type: "mysql",
  host: "app-db",
  port: 3306,
  username: "web-user",
  password: "p-web-user",
  database: "tryout_backend",

  synchronize: false,
  migrationsRun: false,
  dropSchema: false,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/migrations',
  }
} as ConnectionOptions;

export = config
