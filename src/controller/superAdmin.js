// SUPER ADMIN CONTROLLER
const SuperAdminModel = require("../model/superAdmins");
const BlogPostModel = require("../model/blogPost");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const slugify = require("slugify");
const { successResponse, errorResponse } = require("../utils/responseHelper");
const Token = require("../utils/token");
const HelperFunction = require("../utils/helperFunction");

/**
 * @description - THIS IS THE SUPER ADMIN ENDPOINTS
 */

class superAdminController {
  /**
   * @description - THIS ENDPOINT IS USED TO GET ALL SUPER ADMINS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof superAdminController
   */

  static async getSuperAdmins(req, res) {
    if (req.user.role !== "superAdmin")
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
      const result = await SuperAdminModel.paginate(query, options);

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
      return errorResponse(res, 500, "error found , cannot get superAdmins");
    }
  }

  /**
   * @description - THIS ENDPOINT ALLOWS SUPER ADMIN TO GET THEIR PROFILE
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof superAdminController
   */

  static async getProfile(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { _id } = req.user;

    const superAdmin = await SuperAdminModel.find({ _id }).select("-password");

    successResponse(res, 201, superAdmin);
  }

  /**
   * @description - THIS ENDPOINT IS USED TO GET ALL SUPER ADMINS COUNTS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof superAdminController
   */

  static async getSuperAdminCounts(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const counts = await SuperAdminModel.countDocuments();
    if (!counts) {
      return res.status(404).json({ counts: 0 });
    } else {
      return res.status(200).send({ counts: counts });
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO GET A SUPER ADMIN BY IT'S ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof superAdminController
   */

  static async getSuperAdminsById(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    // GETTING THE ID IN THE PARAMS
    const { id } = req.params;

    // CHECKING IF ITS A VALID
    HelperFunction.isValidObjectId(id);

    // GETTING THE SUPER ADMIN WITH THE PROVIDED ID
    const superAdmins = await SuperAdminModel.findById({
      _id: req.params.id,
    })
      .select("-_id -createdAt -updatedAt -password -__v")
      .sort({ " superAdminDate": -1 });

    if (!superAdmins) {
      return res
        .status(404)
        .json({ message: "superAdmin with that id not found" });
    } else {
      return res.status(200).send({ superAdmin: superAdmins });
    }
  }

  /**
   * @description -  THIS ENDPOINT IS USED TO REGISTER A NEW SUPER ADMIN
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof superAdminController
   */

  static async RegisterSuperAdmins(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { userName, email, password, country, city, mobile } = req.body;
    try {
      const superAdminExist = await SuperAdminModel.findOne({
        email,
      });
      if (superAdminExist)
        return res
          .status(400)
          .json({ message: "superAdmin already exists please login" });

      const mobileExist = await SuperAdminModel.findOne({ mobile });
      if (mobileExist)
        return errorResponse(
          res,
          406,
          "mobile already exists pls use a new mobile"
        );

      const hashedPassword = HelperFunction.hashPassword(password);

      const createSuperAdmin = await SuperAdminModel.create({
        userName: userName,
        email: email,
        password: hashedPassword,
        country: country,
        city: city,
        mobile: mobile,
      });

      // REMOVE THE PASSWORD FROM THE RESPONSE BEEN SENT TO THE CLIENT
      createSuperAdmin.password = undefined;

      if (!createSuperAdmin)
        return errorResponse(res, 500, "superAdmin not created");

      successResponse(res, 201, "registered please login", createSuperAdmin);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO LOGIN A SUPER ADMIN
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof superAdminController
   */

  static async loginSuperAdmins(req, res) {
    const { email, password } = req.body;

    try {
      const superAdmin = await SuperAdminModel.findOne({ email });

      if (!superAdmin) {
        return errorResponse(res, 404, "superAdmin with this email not found");
      } else if (
        superAdmin &&
        bcrypt.compareSync(password, superAdmin.password)
      ) {
        const accessToken = Token.generateToken(superAdmin);
        res.cookie("superAdmin", accessToken, {
          maxAge: 1 * 24 * 28 * 24 * 1000,
          httpOnly: true,
        });
        successResponse(res, 200, "logged in", superAdmin.email);
      } else {
        errorResponse(res, 404, "incorrect password");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description -   THIS ENDPOINT IS USED TO LOGOUT SUPER ADMINS
   * @param {object} req -  THE REQUEST OBJECT
   * @param {object} res -  THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof superAdminController
   */

  static async logoutSuperAdmins(req, res) {
    if (req?.user?.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    res.cookie("superAdmin", "", {
      maxAge: 1,
      httpOnly: true,
    });

    successResponse(res, 200, "logged out");
  }

  /**
   * @description - THIS ENDPOINT IS USED TO UPDATE SUPER ADMINS BY ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS AN OBJECT
   * @memberof superAdminController
   */

  static async updateSuperAdminById(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    try {
      const mobileExists = await SuperAdminModel.findOne({
        mobile: req.body.mobile,
      });
      if (mobileExists)
        return errorResponse(
          res,
          401,
          "mobile already exists , pls use a different one"
        );

      const superAdmin = await SuperAdminModel.findByIdAndUpdate(
        { _id: req.params.id },
        req.body,
        {
          new: true,
        }
      );

      // REMOVE THE SUPER ADMIN PASSWORD FROM THE RESPONSE BEEN SEND TO THE CLIENT
      superAdmin.password = undefined;

      if (!superAdmin) {
        return errorResponse(res, 500, "internet error");
      } else {
        return successResponse(res, 200, "updated successfully", superAdmin);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT ALLOW SUPER ADMIN TO UPDATE THEIR PROFILE
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof superAdminController
   */

  static async updateProfile(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    try {
      const { _id } = req.user;

      const superAdmin = await SuperAdminModel.findByIdAndUpdate(
        { _id },
        req.body,
        {
          new: true,
        }
      );

      superAdmin.password = undefined;

      if (!superAdmin) return errorResponse(res, 500, "internet error");

      successResponse(res, 200, "updated", superAdmin);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO DELETE A SUPER ADMIN BY ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - // RETURNS AN OBJECT
   * @memberof superAdminController
   */

  static async deleteSuperAdminById(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    const delSuperAdmin = await SuperAdminModel.findByIdAndDelete({
      _id: req.params.id,
    });

    if (!delSuperAdmin) {
      return errorResponse(res, 404, "superAdmin not found");
    } else {
      return successResponse(res, 200, "superAdmin deleted  successfully");
    }
  }

  /**
   *@description - THIS ENDPOINT IS FOR SUPER ADMINS TO CHANGE PASSWORD
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {string} - RETURNS A SUCCESS MESSAGE
   * @memberof superAdminController
   */
  static async changePassword(req, res) {
    if (req?.user?.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.superAdmin;

    const { newPassword, oldPassword } = req.body;

    const superAdmin = await SuperAdminModel.findOne({ id });

    const oldPasswordIsMatched = HelperFunction.comparePassword(
      oldPassword,
      superAdmin.password
    );

    const hashedPassword = HelperFunction.hashPassword(newPassword);

    if (!oldPasswordIsMatched) {
      return errorResponse(res, 400, "incorrect password");
    } else {
      HelperFunction.generatePasswordResetToken();
      superAdmin.password = hashedPassword;

      await superAdmin.save();

      return successResponse(res, 200, "password updated");
    }
  }

  /**
   * @description - THIS ENDPOINT TO REQUEST FOR A FORGOT PASSWORD MAIL
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A SUCCESS MESSAGE
   * @memberof superAdminController
   */

  static async forgotPassword(req, res) {
    const { email } = req.body;

    const superAdmin = await SuperAdminModel.findOne({ email });

    if (!superAdmin) {
      return errorResponse(res, 404, "superAdmin with this email not found");
    } else if (superAdmin) {
      const resetToken = HelperFunction.generatePasswordResetToken();

      const resetUrl = `Hi please click the link to reset your password, link is only valid for 10min <a href=http://localhost:8080/api/superAdmin/resetPassword/${resetToken} >click here</a> `;

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
   * @description - THIS ENDPOINT RESET THE SUPER ADMIN PASSWORD
   * @param {object} req - THE RESPONSE OBJECT
   * @param {object} res - THE REQUEST OBJECT
   * @returns {object} - RETURNS A SUCCESS RESPONSE
   * @memberof superAdminController
   */

  static async resetPassword(req, res) {
    const { tokenId } = req.params;

    const { newPassword } = req.body;

    try {
      const hashToken = crypto
        .createHash("sha256")
        .update(tokenId)
        .digest("hex");

      const superAdmin = await SuperAdminModel.findOne({
        passwordResetToken: hashToken,
        passwordResetTokenExpiresAt: { $gt: Date.now() },
      });

      if (!superAdmin) {
        return errorResponse(
          res,
          404,
          "token already expired , pls try again later"
        );
      } else {
        const hashedPassword = HelperFunction.hashPassword(newPassword);

        superAdmin.password = hashedPassword;
        superAdmin.passwordResetToken = undefined;
        superAdmin.passwordResetTokenExpiresAt = undefined;

        await superAdmin.save();
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
   * @memberof superAdminController
   */

  static async saveBlogToList(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { blogId } = req.body;

    const loggedInSuperAdminId = req.user._id;

    const blog = await BlogPostModel.findById(blogId);

    if (!blog) return errorResponse(res, 404, "blog not found");

    const superAdmin = await SuperAdminModel.findById(loggedInSuperAdminId);

    const alreadySaved = superAdmin.saveBlog.find(
      (blogId) => blogId.toString() === blogId.toString()
    );

    if (alreadySaved) {
      superAdmin.saveBlog.pull(blogId);

      await superAdmin.save();

      return successResponse(res, 200, "removed from save list");
    } else {
      superAdmin.saveBlog.push(blogId);

      await superAdmin.save();

      return successResponse(res, 200, "added to save list");
    }
  }

  static async getSavedList(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    try {
      const loggedInSuperAdminId = req.user._id;

      const getSavedList = await SuperAdminModel.findById(loggedInSuperAdminId)
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

  /**
   * @description - THE ENDPOINT CREATES A BLOG POST
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object}  - RETURNS A MESSAGE
   * @memberof blogController
   */
  static async createBlogs(req, res) {
    if (req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    try {
      if (req.body.title) {
        req.body.slug = slugify(req.body.title);
      }

      const blogExists = await BlogPostModel.findOne({ title: req.body.title });
      if (blogExists) return errorResponse(res, 400, "blog Exists");

      const blogSlugExists = await BlogPostModel.findOne({
        slug: req.body.slug,
      });
      if (blogSlugExists) return errorResponse(res, 400, "blog Exists");

      const existingSuperAdmin = await SuperAdminModel.findById({
        _id: req.user._id,
      });

      const createBlog = await new BlogPostModel(req.body).save();

      if (createBlog) {
        createBlog.postedBy = existingSuperAdmin.id;

        await createBlog.save();

        successResponse(res, 200, createBlog);
      } else {
        return errorResponse(res, 500, "blog post not created");
      }
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = superAdminController;
