// ADMIN CONTROLLER
const AdminModel = require("../model/admins");
const BlogPostModel = require("../model/blogPost");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const slugify = require("slugify");
const { successResponse, errorResponse } = require("../utils/responseHelper");
const Token = require("../utils/token");
const HelperFunction = require("../utils/helperFunction");

/**
 * @description - THIS IS THE ADMIN ENDPOINTS
 */

class AdminController {
  /**
   * @description - THIS ENDPOINT IS USED TO GET ALL ADMINS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof adminController
   */

  static async getAdmins(req, res) {
    if (req.user.role !== "superAdmin" && req.user.role !== "admin")
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
      const result = await AdminModel.paginate(query, options);

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
      return errorResponse(res, 500, "error found , cannot get admins");
    }
  }

  /**
   * @description - THIS ENDPOINT ALLOWS ADMIN TO GET THEIR PROFILE
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof adminController
   */

  static async getProfile(req, res) {
    if (req.user.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

    const { _id } = req.user;

    const admin = await AdminModel.find({ _id }).select("-password");

    successResponse(res, 201, admin);
  }

  /**
   * @description - THIS ENDPOINT IS USED TO GET ALL ADMINS COUNTS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof adminController
   */

  static async getAdminCounts(req, res) {
    if (req.user.role !== "superAdmin" && req.user.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

    const counts = await AdminModel.countDocuments();
    if (!counts) {
      return res.status(404).json({ counts: 0 });
    } else {
      return res.status(200).send({ counts: counts });
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO GET A ADMIN BY IT'S ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof adminController
   */

  static async getAdminsById(req, res) {
    if (req.user.role !== "superAdmin" && req.user.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

    // GETTING THE ID IN THE PARAMS
    const { id } = req.params;

    // CHECKING IF ITS A VALID
    HelperFunction.isValidObjectId(id);

    // GETTING THE ADMIN WITH THE PROVIDED ID
    const admins = await AdminModel.findById({ _id: req.params.id })
      .select("-_id -createdAt -updatedAt -password -__v")
      .sort({ " adminDate": -1 });

    if (!admins) {
      return res.status(404).json({ message: "admin with that id not found" });
    } else {
      return res.status(200).send({ admin: admins });
    }
  }

  /**
   * @description -  THIS ENDPOINT IS USED TO REGISTER A NEW ADMIN
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof adminController
   */

  static async RegisterAdmins(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");
    const { userName, email, password, country, city, mobile } = req.body;
    try {
      const adminExist = await AdminModel.findOne({ email });
      if (adminExist)
        return res
          .status(400)
          .json({ message: "admin already exists please login" });

      const mobileExist = await AdminModel.findOne({ mobile });
      if (mobileExist)
        return errorResponse(
          res,
          406,
          "mobile already exists pls use a new mobile"
        );

      const hashedPassword = HelperFunction.hashPassword(password);

      const createAdmin = await AdminModel.create({
        userName: userName,
        email: email,
        password: hashedPassword,
        country: country,
        city: city,
        mobile: mobile,
      });

      // REMOVE THE PASSWORD FROM THE RESPONSE BEEN SENT TO THE CLIENT
      createAdmin.password = undefined;

      if (!createAdmin) return errorResponse(res, 500, "admin not created");

      successResponse(res, 201, "registered please login", createAdmin);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO LOGIN A ADMIN
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof adminController
   */

  static async loginAdmins(req, res) {
    const { email, password } = req.body;

    try {
      const admin = await AdminModel.findOne({ email });

      if (!admin) {
        return errorResponse(res, 404, "admin with this email not found");
      } else if (admin && bcrypt.compareSync(password, admin.password)) {
        const accessToken = Token.generateToken(admin);
        res.cookie("admin", accessToken, {
          maxAge: 1 * 24 * 28 * 24 * 1000,
          httpOnly: true,
        });
        successResponse(res, 200, "logged in", admin.email);
      } else {
        errorResponse(res, 404, "incorrect password");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description -   THIS ENDPOINT IS USED TO LOGOUT ADMINS
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof adminController
   */

  static async logoutAdmins(req, res) {
    if (req?.user?.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

    res.cookie("admin", "", {
      maxAge: 1,
      httpOnly: true,
    });

    successResponse(res, 200, "logged out");
  }

  /**
   * @description - THIS ENDPOINT IS USED TO UPDATE ADMINS BY ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS AN OBJECT
   * @memberof adminController
   */

  static async updateAdminById(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    try {
      const mobileExists = await AdminModel.findOne({
        mobile: req.body.mobile,
      });
      if (mobileExists)
        return errorResponse(
          res,
          401,
          "mobile already exists , pls use a different one"
        );

      const admin = await AdminModel.findByIdAndUpdate(
        { _id: req.params.id },
        req.body,
        {
          new: true,
        }
      );

      // REMOVE THE ADMIN PASSWORD FROM THE RESPONSE BEEN SEND TO THE CLIENT
      admin.password = undefined;

      if (!admin) {
        return errorResponse(res, 500, "internet error");
      } else {
        return successResponse(res, 200, "updated successfully", admin);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT ALLOW ADMIN TO UPDATE THEIR PROFILE
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof adminController
   */

  static async updateProfile(req, res) {
    if (req.user.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

    try {
      const { _id } = req.user;

      const admin = await AdminModel.findByIdAndUpdate({ _id }, req.body, {
        new: true,
      });

      admin.password = undefined;

      if (!admin) return errorResponse(res, 500, "internet error");

      successResponse(res, 200, "updated", admin);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO DELETE A ADMIN BY ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof adminController
   */

  static async deleteAdminById(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    const delAdmin = await AdminModel.findByIdAndDelete({ _id: req.params.id });

    if (!delAdmin) {
      return errorResponse(res, 404, "admin not found");
    } else {
      return successResponse(res, 200, "admin deleted  successfully");
    }
  }

  /**
   *@description - THIS ENDPOINT IS FOR ADMINS TO CHANGE PASSWORD
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {string} - RETURNS A SUCCESS MESSAGE
   * @memberof adminController
   */
  static async changePassword(req, res) {
    if (req?.user?.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.admin;

    const { newPassword, oldPassword } = req.body;

    const admin = await AdminModel.findOne({ id });

    const oldPasswordIsMatched = HelperFunction.comparePassword(
      oldPassword,
      admin.password
    );

    const hashedPassword = HelperFunction.hashPassword(newPassword);

    if (!oldPasswordIsMatched) {
      return errorResponse(res, 400, "incorrect password");
    } else {
      HelperFunction.generatePasswordResetToken();
      admin.password = hashedPassword;

      await admin.save();

      return successResponse(res, 200, "password updated");
    }
  }

  /**
   * @description - THIS ENDPOINT TO REQUEST FOR A FORGOT PASSWORD MAIL
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A SUCCESS MESSAGE
   * @memberof adminController
   */

  static async forgotPassword(req, res) {
    const { email } = req.body;

    const admin = await AdminModel.findOne({ email });

    if (!admin) {
      return errorResponse(res, 404, "admin with this email not found");
    } else if (admin) {
      const resetToken = HelperFunction.generatePasswordResetToken();

      const resetUrl = `Hi please click the link to reset your password, link is only valid for 10min <a href=http://localhost:8080/api/admin/resetPassword/${resetToken} >click here</a> `;

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
   * @description - THIS ENDPOINT RESET THE ADMIN PASSWORD
   * @param {object} req - THE RESPONSE OBJECT
   * @param {object} res - THE REQUEST OBJECT
   * @returns {object} - RETURNS A SUCCESS RESPONSE
   * @memberof adminController
   */

  static async resetPassword(req, res) {
    const { tokenId } = req.params;

    const { newPassword } = req.body;

    try {
      const hashToken = crypto
        .createHash("sha256")
        .update(tokenId)
        .digest("hex");

      const admin = await AdminModel.findOne({
        passwordResetToken: hashToken,
        passwordResetTokenExpiresAt: { $gt: Date.now() },
      });

      if (!admin) {
        return errorResponse(
          res,
          404,
          "token already expired , pls try again later"
        );
      } else {
        const hashedPassword = HelperFunction.hashPassword(newPassword);

        admin.password = hashedPassword;
        admin.passwordResetToken = undefined;
        admin.passwordResetTokenExpiresAt = undefined;

        await admin.save();
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
   * @memberof adminController
   */

  static async saveBlogToList(req, res) {
    if (req.user.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

    const { blogId } = req.body;

    const loggedInAdminId = req.user._id;

    const blog = await BlogPostModel.findById(blogId);

    if (!blog) return errorResponse(res, 404, "blog not found");

    const admin = await AdminModel.findById(loggedInAdminId);

    const alreadySaved = admin.saveBlog.find(
      (blogId) => blogId.toString() === blogId.toString()
    );

    if (alreadySaved) {
      admin.saveBlog.pull(blogId);

      await admin.save();

      return successResponse(res, 200, "removed from save list");
    } else {
      admin.saveBlog.push(blogId);

      await admin.save();

      return successResponse(res, 200, "added to save list");
    }
  }

  static async getSavedList(req, res) {
    if (req.user.role !== "admin")
      return errorResponse(res, 401, "unauthorized");

    try {
      const loggedInAdminId = req.user._id;

      const getSavedList = await AdminModel.findById(loggedInAdminId)
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

module.exports = AdminController;
