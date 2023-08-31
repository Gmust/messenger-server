import * as process from 'process';

export default () => ({
  database: {
    url: process.env.DB_URL,
    name: process.env.DB_NAME
  },
  jwt: {
    secret: process.env.JWT_SECRET
  }
});
