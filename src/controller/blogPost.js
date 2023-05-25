// BLOGS CONTROLLER
const BlogPostModel = require("../model/blogPost");
const { errorResponse, successResponse } = require("../utils/responseHelper");
const HelperFunction = require("../utils/helperFunction");
const AdminModel = require("../model/admins");
const slugify = require("slugify");

class blogController {
  /**
   * @description - THIS ENDPOINT IS USED TO GET ALL BLOG POSTS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} -  RETURNS AN OBJECT
   * @memberof blogController
   */

  static async getBlogs(req, res) {
    if (
      req.user.role !== "user" &&
      req.user.role !== "admin" &&
      req.user.role !== "superAdmin"
    )
      return errorResponse(res, 401, "unauthorized");

    try {
      // CREATE A QUERY OPTIONS
      const options = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
        sort: { createdAt: -1 },
      };

      // CREATE A SEARCH BAR QUERY
      const search = req.query.search;
      const query = search ? { title: { $regex: search, $options: "i" } } : {};
      const result = await BlogPostModel.paginate(query, options);

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
   * @description - THIS ENDPOINT GET A BLOG POST BY ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof blogController
   */

  static async getBlogsById(req, res) {
    if (
      req.user.role !== "user" &&
      req.user.role !== "admin" &&
      req.user.role !== "superAdmin"
    )
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    const Blog = await BlogPostModel.findById({ _id: req.params.id });

    if (Blog) {
      await BlogPostModel.findByIdAndUpdate(
        { _id: req.params.id },
        {
          $inc: { numberOfView: 1 },
        }
      );
      return successResponse(res, 200, "blog found", Blog);
    } else {
      return errorResponse(res, 404, "blog not found");
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO UPDATE BLOG POST
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   */
  static async updateBlogsById(req, res) {
    if (req.user.role !== "admin" && req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    const updateBlog = await BlogPostModel.findByIdAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true,
      }
    );

    if (!updateBlog) {
      return errorResponse(res, 500, "internet error");
    } else {
      return successResponse(res, 200, "updated", updateBlog);
    }
  }

  static async deleteBlogsById(req, res) {
    if (req.user.role !== "admin" && req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    try {
      const Blog = await BlogPostModel.findByIdAndDelete({
        _id: req.params.id,
      });

      if (!Blog) return errorResponse(res, 200, "already deleted");

      successResponse(res, 200, "deleted blogPost");
    } catch (err) {
      console.log(err);
      errorResponse(res, 500, "error found");
    }
  }

  /**
   * @description - THE ENDPOINT IS USED TO LIKE OR DISLIKE A BLOG POST TO USE THIS DOUBLE CLICK THE SEND BUTTON TO EITHER LIKE OR DISLIKE
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof blogController
   */

  static async likeBlogPostOrDislike(req, res) {
    if (
      req.user.role !== "user" &&
      req.user.role !== "admin" &&
      req.user.role !== "superAdmin"
    )
      return errorResponse(res, 401, "unauthorized");

    const { blogId } = req.body;
    const loggedInUserId = req.user._id;

    try {
      const blog = await BlogPostModel.findById(blogId);

      if (!blog) return errorResponse(res, 404, "blog not found");

      const wasDislikedBefore = blog.dislikedUsers.includes(loggedInUserId);

      if (wasDislikedBefore) {
        blog.dislikedUsers = blog.dislikedUsers.filter(
          (userId) => userId.toString() !== loggedInUserId
        );

        blog.dislikedUsers.pull(loggedInUserId);
        blog.dislike = false;
        blog.likedUsers.push(loggedInUserId);
        blog.like = true;

        await blog.save();
        return successResponse(res, 200, "liked");
      }

      const wasLikedBefore = blog.likedUsers.includes(loggedInUserId);

      if (wasLikedBefore) {
        blog.likedUsers = blog.likedUsers.filter(
          (userId) => userId.toString() !== loggedInUserId
        );

        blog.likedUsers.pull(loggedInUserId);
        blog.like = false;
        blog.dislikedUsers.push(loggedInUserId);
        blog.dislike = true;

        await blog.save();

        return successResponse(res, 200, "disliked");
      } else {
        blog.likedUsers.push(loggedInUserId);
        blog.like = true;

        await blog.save();

        return successResponse(res, 200, "liked");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO COMMENT ON A BLOG POST
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof blogController
   */

  static async commentToBlogPost(req, res) {
    if (
      req.user.role !== "user" &&
      req.user.role !== "admin" &&
      req.user.role !== "superAdmin"
    )
      return errorResponse(res, 401, "unauthorized");

    try {
      const { blogId, comment, commentedBy } = req.body;

      const loggedInUserId = req.user._id;

      const blog = await BlogPostModel.findById(blogId);

      if (!blog) return errorResponse(res, 404, "blog not found");

      const wasCommentedBefore = blog.comments.find(
        (userId) => userId.commentedBy.toString() === loggedInUserId
      );

      if (wasCommentedBefore) {
        wasCommentedBefore.commentedBy = loggedInUserId;
        wasCommentedBefore.comment = comment;

        await blog.save();

        return successResponse(res, 200, blog);
      } else {
        blog.comments.push({ comment: comment, commentedBy: loggedInUserId });

        await blog.save();

        return successResponse(res, 200, blog);
      }
    } catch (error) {
      console.log(error);
      errorResponse(res, 500, "error found ");
    }
  }
}
module.exports = blogController;
