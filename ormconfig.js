const devConfig = [
  {
    type: 'postgres',
    host: '159.223.125.81',
    port: 35432,
    username: 'postgres',
    password: 'd7ae6bbfa000ab3e01cf70f5a757effe',
    database: process.env.CLIENT,
    entities: [
      './src/modules/**/infra/typeorm/entities/**/*.ts',
      './src/modules/**/infra/typeorm/entities/*.ts',
    ],
    migrations: ['./src/shared/infra/typeorm/migrations/*.ts'],
    cli: {
      migrationsDir: './src/shared/infra/typeorm/migrations',
    },
  },
];

const prodConfig = [
  {
    type: 'postgres',
    host: 'localhost',
    port: String(process.env.CLIENT) === 'Jardins' ? 45432 : 35432,
    username: 'postgres',
    password: 'd7ae6bbfa000ab3e01cf70f5a757effe',
    database: process.env.CLIENT,
    entities: [
      './dist/modules/**/infra/typeorm/entities/**/*.js',
      './dist/modules/**/infra/typeorm/entities/*.js',
    ],
    migrations: ['./dist/shared/infra/typeorm/migrations/*.js'],
    cli: {
      migrationsDir: './dist/shared/infra/typeorm/migrations',
    },
  },
];

module.exports = process.env.ENV === 'dev' ? devConfig : prodConfig;
