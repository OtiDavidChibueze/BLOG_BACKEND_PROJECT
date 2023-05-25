const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { MAIL, MAIL_P } = require("../config/keys");

class HelperFunction {
  /**
   * @description -  THIS IS USED TO CHECK IF ITS A VALID MONGODB ID
   * @param {id} string -  THE ID TO BE VALIDATED
   * @return {string} -  RETURNS A BOOLEAN
   * @memberof HelperFunction
   */

  static isValidObjectId(id) {
    const isValid = mongoose.isValidObjectId(id);
    if (!isValid) throw new Error("invalid mongoose id");
  }

  /**
   *@description - THIS IS USED TO HASH A PASSWORD
   @param {object} password - THE PASSWORD TO BE HASHED
   @returns {string} - returns a string
   @memberof HelperFunction
   */

  static hashPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync());
  }

  /**
   * @description - THIS IS A NODEMAILER USED TO SEND MAILS
   * @param {object} data - THE DATA OBJECT
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @memberof HelperFunction
   */
  static async sendEmail(data, req, res) {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, //* true for 465, false for other ports
      auth: {
        user: MAIL, //* generated ethereal user
        pass: MAIL_P, //* generated ethereal password
      },
    });

    //* send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"hello 👻" <funds@example.com>', //* sender address
      to: data.to, //* list of receivers
      subject: data.subject, //* Subject line
      text: data.text, //* plain text body
      html: data.htm, //* html body
    });

    console.log("Message sent: %s", info.messageId);
    //* Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    //* Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    //* Preview URL: https://ether
  }

  /**
   * @description - THIS IS USED TO COMPARE PASSWORDS
   * @param {string} password - THE PROVIDED PASSWORD
   * @param {string} hashedPassword - THE PASSWORD TO BE COMPARED WITH
   * @returns {string} - RETURNS A STRING
   * @memberof HelperFunction
   */

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async generatePasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetTokenExpiresAt = Date.now() + 10 * 60 * 1000; //* set expiration to 10 minutes
    return resetToken;
  }
}

module.exports = HelperFunction;
