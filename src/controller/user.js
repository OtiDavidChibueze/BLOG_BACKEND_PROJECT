// USER CONTROLLER
const UserModel = require("../model/user");
const BlogPostModel = require("../model/blogPost");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const slugify = require("slugify");
const { successResponse, errorResponse } = require("../utils/responseHelper");
const Token = require("../utils/token");
const HelperFunction = require("../utils/helperFunction");

/**
 * @description - THIS IS THE USER ENDPOINTS
 */

class userController {
  /**
   * @description - THIS ENDPOINT IS USED TO GET ALL USERS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof UserController
   */

  static async getUsers(req, res) {
    if (req.user.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

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
   * @description - THIS ENDPOINT ALLOWS USER TO GET THEIR PROFILE
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof UserController
   */

  static async getProfile(req, res) {
    if (req.user.role !== "user")
      return errorResponse(res, 401, "unauthorized");

    const { _id } = req.user;

    const User = await UserModel.find({ _id }).select("-password");

    successResponse(res, 201, User);
  }

  /**
   * @description - THIS ENDPOINT IS USED TO GET ALL USERS COUNTS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof UserController
   */

  static async getUserCounts(req, res) {
    if (req.user.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

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
   * @memberof UserController
   */

  static async getUsersById(req, res) {
    if (req.user.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

    // GETTING THE ID IN THE PARAMS
    const { id } = req.params;

    // CHECKING IF ITS A VALID
    HelperFunction.isValidObjectId(id);

    // GETTING THE USER WITH THE PROVIDED ID
    const users = await UserModel.findById({
      _id: req.params.id,
    })
      .select("-_id -createdAt -updatedAt -password -__v")
      .sort({ " UserDate": -1 });

    if (!users) {
      return res.status(404).json({ message: "User with that id not found" });
    } else {
      return res.status(200).send({ User: users });
    }
  }

  /**
   * @description -  THIS ENDPOINT IS USED TO REGISTER A NEW USER
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof UserController
   */

  static async RegisterUsers(req, res) {
    if (req.user.role !== "admin" && req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");
    const { userName, email, password, country, city, mobile } = req.body;
    try {
      const UserExist = await UserModel.findOne({
        email,
      });
      if (UserExist)
        return res
          .status(400)
          .json({ message: "User already exists please login" });

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

      if (!createUser) return errorResponse(res, 500, "User not created");

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
   * @memberof UserController
   */

  static async loginUsers(req, res) {
    const { email, password } = req.body;

    try {
      const User = await UserModel.findOne({ email });

      if (!User) {
        return errorResponse(res, 404, "User with this email not found");
      } else if (User && bcrypt.compareSync(password, User.password)) {
        const accessToken = Token.generateToken(User);
        res.cookie("user", accessToken, {
          maxAge: 1 * 24 * 28 * 24 * 1000,
          httpOnly: true,
        });
        successResponse(res, 200, "logged in", User.email);
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
   * @memberof UserController
   */

  static async logoutUsers(req, res) {
    if (req?.user?.role !== "user")
      return errorResponse(res, 401, "unauthorized");

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
   * @memberof UserController
   */

  static async updateUserById(req, res) {
    if (req.user.role !== "admin" && req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    try {
      const mobileExists = await UserModel.findOne({
        mobile: req.body.mobile,
      });
      if (mobileExists)
        return errorResponse(
          res,
          401,
          "mobile already exists , pls use a different one"
        );

      const User = await UserModel.findByIdAndUpdate(
        { _id: req.params.id },
        req.body,
        {
          new: true,
        }
      );

      // REMOVE THE USER PASSWORD FROM THE RESPONSE BEEN SEND TO THE CLIENT
      User.password = undefined;

      if (!User) {
        return errorResponse(res, 500, "internet error");
      } else {
        return successResponse(res, 200, "updated successfully", User);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT ALLOW USER TO UPDATE THEIR PROFILE
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof UserController
   */

  static async updateProfile(req, res) {
    if (req.user.role !== "user")
      return errorResponse(res, 401, "unauthorized");

    try {
      const { _id } = req.user;

      const User = await UserModel.findByIdAndUpdate({ _id }, req.body, {
        new: true,
      });

      User.password = undefined;

      if (!User) return errorResponse(res, 500, "internet error");

      successResponse(res, 200, "updated", User);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO DELETE A USER BY ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof UserController
   */

  static async deleteUserById(req, res) {
    if (req.user.role !== "admin" && req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    const delUser = await UserModel.findByIdAndDelete({
      _id: req.params.id,
    });

    if (!delUser) {
      return errorResponse(res, 404, "User not found");
    } else {
      return successResponse(res, 200, "User deleted  successfully");
    }
  }

  /**
   *@description - THIS ENDPOINT IS FOR USERS TO CHANGE PASSWORD
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {string} - RETURNS A SUCCESS MESSAGE
   * @memberof UserController
   */
  static async changePassword(req, res) {
    if (req?.user?.role !== "user")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.User;

    const { newPassword, oldPassword } = req.body;

    const User = await UserModel.findOne({ id });

    const oldPasswordIsMatched = HelperFunction.comparePassword(
      oldPassword,
      User.password
    );

    const hashedPassword = HelperFunction.hashPassword(newPassword);

    if (!oldPasswordIsMatched) {
      return errorResponse(res, 400, "incorrect password");
    } else {
      HelperFunction.generatePasswordResetToken();
      User.password = hashedPassword;

      await User.save();

      return successResponse(res, 200, "password updated");
    }
  }

  /**
   * @description - THIS ENDPOINT TO REQUEST FOR A FORGOT PASSWORD MAIL
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A SUCCESS MESSAGE
   * @memberof UserController
   */

  static async forgotPassword(req, res) {
    const { email } = req.body;

    const User = await UserModel.findOne({ email });

    if (!User) {
      return errorResponse(res, 404, "User with this email not found");
    } else if (User) {
      const resetToken = HelperFunction.generatePasswordResetToken();

      const resetUrl = `Hi please click the link to reset your password, link is only valid for 10min <a href=http://localhost:8080/api/User/resetPassword/${resetToken} >click here</a> `;

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
   * @memberof UserController
   */

  static async resetPassword(req, res) {
    const { tokenId } = req.params;

    const { newPassword } = req.body;

    try {
      const hashToken = crypto
        .createHash("sha256")
        .update(tokenId)
        .digest("hex");

      const User = await UserModel.findOne({
        passwordResetToken: hashToken,
        passwordResetTokenExpiresAt: { $gt: Date.now() },
      });

      if (!User) {
        return errorResponse(
          res,
          404,
          "token already expired , pls try again later"
        );
      } else {
        const hashedPassword = HelperFunction.hashPassword(newPassword);

        User.password = hashedPassword;
        User.passwordResetToken = undefined;
        User.passwordResetTokenExpiresAt = undefined;

        await User.save();
        successResponse(res, 200, "password updated pls login");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO SAVE A BLOG TO YOUR BLOG LIST , CLICK SEND BUTTON TO SAVE OR CLICK AGAIN TO REMOVE
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {  object} - RETURNS A MESSAGE
   * @memberof UserController
   */

  static async saveBlogToList(req, res) {
    if (req.user.role !== "User")
      return errorResponse(res, 401, "unauthorized");

    const { blogId } = req.body;

    const loggedInUserId = req.user._id;

    const blog = await BlogPostModel.findById(blogId);

    if (!blog) return errorResponse(res, 404, "blog not found");

    const User = await UserModel.findById(loggedInUserId);

    const alreadySaved = User.saveBlog.find(
      (blogId) => blogId.toString() === blogId.toString()
    );

    if (alreadySaved) {
      User.saveBlog.pull(blogId);

      await User.save();

      return successResponse(res, 200, "removed from save list");
    } else {
      User.saveBlog.push(blogId);

      await User.save();

      return successResponse(res, 200, "added to save list");
    }
  }

  static async getSavedList(req, res) {
    if (req.user.role !== "user")
      return errorResponse(res, 401, "unauthorized");

    try {
      const loggedInUserId = req.user._id;

      const getSavedList = await UserModel.findById(loggedInUserId)
        .select("saveBlog -_id")
        .populate({
          path: "saveBlog",
          select: "title description postedBy",
        });

      if (!getSavedList) return errorResponse(res, 404, "no saved blogs");

      successResponse(res, 200, getSavedList);
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = userController;
