// USER CONTROLLER
const UserModel = require("../model/user");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { successResponse, errorResponse } = require("../utils/responseHelper");
const Token = require("../utils/token");
const HelperFunction = require("../utils/helperFunction");

/**
 * @description - THIS IS THE USER ENDPOINTS
 */

class UserController {
  /**
   * @description - THIS ENDPOINT IS USED TO GET ALL USERS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof userController
   */

  static async getUsers(req, res) {
    try {
      // CREATE A QUERY OPTIONS
      const options = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
        sort: { createdAt: -1 },
        select: "-password",
      };

      // CREATE A SEARCH BAR QUERY
      const search = req.query.search;
      const query = search ? { email: { $regex: search, $options: "i" } } : {};
      const result = await UserModel.paginate(query, options);

      // IF RESULT HAS NEXT PAGE
      const nextPage = result.hasNextPage
        ? `${req.baseUrl}?page=${req.nextPage}`
        : null;
      // IF RESULT HAS NEXT PAGE
      const prevPage = result.hasPrevPage
        ? `${req.baseUrl}?page=${req.prevPage}`
        : null;

      // SEND A SUCCESS RESPONSE TO THE CLIENT
      return successResponse(
        res,
        200,
        "received",
        result.docs,
        nextPage,
        prevPage
      );
    } catch (error) {
      console.log(error);
      return errorResponse(res, 500, "error found , cannot get users");
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO GET ALL USERS COUNTS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof userController
   */

  static async getUserCounts(req, res) {
    const counts = await UserModel.countDocuments();
    if (!counts) {
      return res.status(404).json({ counts: 0 });
    } else {
      return res.status(200).send({ counts: counts });
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO GET A USER BY IT'S ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof userController
   */

  static async getUsersById(req, res) {
    // GETTING THE ID IN THE PARAMS
    const { id } = req.params;

    // CHECKING IF ITS A VALID
    HelperFunction.isValidObjectId(id);

    // GETTING THE USER WITH THE PROVIDED ID
    const users = await UserModel.findById({ _id: req.params.id })
      .select("-_id -createdAt -updatedAt -password -__v")
      .sort({ " userDate": -1 });

    if (!users) {
      return res.status(404).json({ message: "user with that id not found" });
    } else {
      return res.status(200).send({ user: users });
    }
  }

  /**
   * @description -  THIS ENDPOINT IS USED TO REGISTER A NEW USER
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof userController
   */

  static async RegisterUsers(req, res) {
    const { userName, email, password, country, city, mobile } = req.body;
    try {
      const userExist = await UserModel.findOne({ email });
      if (userExist)
        return res
          .status(400)
          .json({ message: "user already exists please login" });

      const mobileExist = await UserModel.findOne({ mobile });
      if (mobileExist)
        return errorResponse(
          res,
          406,
          "mobile already exists pls use a new mobile"
        );

      const hashedPassword = HelperFunction.hashPassword(password);

      const createUser = await UserModel.create({
        userName: userName,
        email: email,
        password: hashedPassword,
        country: country,
        city: city,
        mobile: mobile,
      });

      // REMOVE THE PASSWORD FROM THE RESPONSE BEEN SENT TO THE CLIENT
      createUser.password = undefined;

      if (!createUser) return errorResponse(res, 500, "user not created");

      successResponse(res, 201, "registered please login", createUser);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO LOGIN A USER
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof userController
   */

  static async loginUsers(req, res) {
    const { email, password } = req.body;

    try {
      const user = await UserModel.findOne({ email });

      if (!user) {
        return errorResponse(res, 404, "user with this email not found");
      } else if (user && bcrypt.compareSync(password, user.password)) {
        const accessToken = Token.generateToken(user);
        res.cookie("user", accessToken, {
          maxAge: 1 * 24 * 28 * 1000,
          httpOnly: true,
        });
        successResponse(res, 200, "logged in", user.email);
      } else {
        errorResponse(res, 404, "incorrect password");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description -   THIS ENDPOINT IS USED TO LOGOUT USERS
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof userController
   */

  static async logoutUsers(req, res) {
    if (req?.user?.role !== "user")
      return errorResponse(res, 403, "unauthorized");

    res.cookie("user", "", {
      maxAge: 1,
      httpOnly: true,
    });

    successResponse(res, 200, "logged out");
  }

  /**
   * @description - THIS ENDPOINT IS USED TO UPDATE USERS BY ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS AN OBJECT
   * @memberof userController
   */

  static async updateUserById(req, res) {
    const { userName, country, city, mobile } = req.body;

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    try {
      const mobileExists = await UserModel.findOne({ mobile });
      if (mobileExists)
        return errorResponse(
          res,
          401,
          "mobile already exists , pls use a different one"
        );

      const user = await UserModel.findByIdAndUpdate(
        { _id: req.params.id },
        req.body,
        {
          new: true,
        }
      );

      // REMOVE THE USER PASSWORD FROM THE RESPONSE BEEN SEND TO THE CLIENT
      user.password = undefined;

      if (!user) {
        return errorResponse(res, 500, "internet error");
      } else {
        return successResponse(res, 200, "updated successfully", user);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO DELETE A USER BY ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof userController
   */

  static async deleteUserById(req, res) {
    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    const delUser = await UserModel.findByIdAndDelete({ _id: req.params.id });

    if (!delUser) {
      return errorResponse(res, 404, "user not found");
    } else {
      return successResponse(res, 200, "user deleted  successfully");
    }
  }

  /**
   *@description - THIS ENDPOINT IS FOR USERS TO CHANGE PASSWORD
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {string} - RETURNS A SUCCESS MESSAGE
   * @memberof userController
   */
  static async changePassword(req, res) {
    if (req?.user?.role !== "user")
      return errorResponse(res, 403, "unauthorized");

    const { id } = req.user;

    const { newPassword, oldPassword } = req.body;

    const user = await UserModel.findOne({ id });

    const oldPasswordIsMatched = HelperFunction.comparePassword(
      oldPassword,
      user.password
    );

    const hashedPassword = HelperFunction.hashPassword(newPassword);

    if (!oldPasswordIsMatched) {
      return errorResponse(res, 400, "incorrect password");
    } else {
      await user.createPasswordResetToken();
      user.password = hashedPassword;

      await user.save();

      return successResponse(res, 200, "password updated");
    }
  }

  /**
   * @description - THIS ENDPOINT TO REQUEST FOR A FORGOT PASSWORD MAIL
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A SUCCESS MESSAGE
   * @memberof userController
   */

  static async forgotPassword(req, res) {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return errorResponse(res, 404, "user with this email not found");
    } else if (user) {
      const resetToken = await user.createPasswordResetToken();

      const resetUrl = `Hi please click the link to reset your password, link is only valid for 10min <a href=http://localhost:8080/api/user/resetPassword/${resetToken} >click here</a> `;

      const data = {
        to: email,
        subject: "password reset link",
        text: "hello",
        htm: resetUrl,
      };

      HelperFunction.sendEmail(data);
      successResponse(res, 200, "pls check your mail and reset your password");
    }
  }

  /**
   * @description - THIS ENDPOINT RESET THE USER PASSWORD
   * @param {object} req - THE RESPONSE OBJECT
   * @param {object} res - THE REQUEST OBJECT
   * @returns {object} - RETURNS A SUCCESS RESPONSE
   * @memberof userController
   */

  static async resetPassword(req, res) {
    const { tokenId } = req.params;

    const { newPassword } = req.body;

    try {
      const hashToken = crypto
        .createHash("sha256")
        .update(tokenId)
        .digest("hex");

      const user = await UserModel.findOne({
        passwordResetToken: hashToken,
        passwordResetTokenExpiresAt: { $gt: Date.now() },
      });

      if (!user) {
        return errorResponse(
          res,
          404,
          "token already expired , pls try again later"
        );
      } else {
        const hashedPassword = HelperFunction.hashPassword(newPassword);

        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpiresAt = undefined;

        await user.save();
        successResponse(res, 200, "password updated pls login");
      }
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = UserController;
