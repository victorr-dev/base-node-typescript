import 'dotenv/config';
import { createConnection } from 'typeorm'

export default function () {
  return createConnection({
    "type": "postgres",
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    "username": process.env.DB_USER,
    "password": process.env.DB_PASS,
    "database": process.env.DB_NAME,
    "synchronize": false,
    "logging": false,
    "entities": [
      "src/models/*.ts",
    ],
    "cli": {
      "entitiesDir": "src/models",
    }

  })
}