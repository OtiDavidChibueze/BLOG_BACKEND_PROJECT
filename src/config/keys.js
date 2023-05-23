//* KEYS
require("dotenv").config();

module.exports = {
  DB_CONNECTION: process.env.DB_CONNECTION,
  PORT: process.env.PORT,
  SECRET: process.env.SECRET,
  MAIL: process.env.MAIL,
  MAIL_P: process.env.MAIL_P,
};
