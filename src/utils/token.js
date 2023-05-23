const jwt = require("jsonwebtoken");
const { SECRET } = require("../config/keys");

class Token {
  /**
   * @description -  THIS IS USED TO GENERATE A TOKEN
   * @param {object} payload -  THE PAYLOAD TO BE SIGNED
   * @returns {string} -  RETURNS A STRING
   */

  static generateToken(user) {
    const payload = {
      userId: user.id,
      role: user.role,
    };

    const options = {
      expiresIn: "1d",
    };

    try {
      const token = jwt.sign(payload, SECRET, options);
      return token;
    } catch (error) {
      throw new Error(error);
    }
  }
}

module.exports = Token;
