import { localConfig } from './local.js';
import { testingConfig } from './testing.js';
import { prodConfig } from './prod.js';
import merge from 'lodash.merge';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const stage = process.env.STAGE || 'local';

let envConfig;
if (stage === 'production') {
  envConfig = prodConfig;
} else if (stage === 'testing') {
  envConfig = testingConfig;
} else {
  envConfig = localConfig;
}

const defaultConfig = {
  stage,
  env: process.env.NODE_ENV,
  port: 3001,
  secrets: {
    jwt: process.env.JWT_SECRET,
    dbUrl: process.env.DATABASE_URL,
  },
};

export const config = merge(defaultConfig, envConfig);
