const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 6080,
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = config;
