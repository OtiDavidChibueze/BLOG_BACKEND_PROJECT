const BlogPostModel = require("../model/blogPost");
const HelperFunction = require("../utils/helperFunction");
const { errorResponse, successResponse } = require("../utils/responseHelper");

class commentController {
  static async getCommentsForASpecificBlogPost(req, res) {
    if (req.user.role !== "admin" && req.user.role !== "superAdmin")
      return errorResponse(res, 401, "unauthorized");

    const { blogPostId } = req.params;

    const comments = await BlogPostModel.find(blogPostId)
      .select("comments")
      .populate({ path: "comments" });

    if (!comments) return errorResponse(res, 404, "no comments available");

    successResponse(res, 200, "comments");
  }

  static async commentToBlogPost(req, res) {
    if (
      req.user.role !== "user" &&
      req.user.role !== "admin" &&
      req.user.role !== "superAdmin"
    )
      return errorResponse(res, 401, "unauthorized");

    try {
      const { blogId } = req.params;

      HelperFunction.isValidObjectId(blogId);

      const { comment, commentedBy } = req.body;

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

        return successResponse(res, 200, "commented", blog);
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

  /**
   *@description - THIS ENDPOINT IS USED TO UPDATE COMMENTS
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof commentController
   */

  static async updateComment(req, res) {
    if (
      req.user.role !== "user" &&
      req.user.role !== "admin" &&
      req.user.role !== "superAdmin"
    )
      return errorResponse(res, 401, "unauthorized");

    try {
      const { blogId, commentId } = req.params;

      HelperFunction.isValidObjectId(blogId);

      HelperFunction.isValidObjectId(commentId);

      const { newComment } = req.body;

      const loggedInUserId = req.user._id;

      const blog = await BlogPostModel.findById(blogId);

      if (!blog) return errorResponse(res, 404, "blog not found");

      const comment = blog.comments.find(
        (userId) => userId._id.toString() === commentId
      );

      if (!comment) return errorResponse(res, 200, "no comment found ");

      // CHECKING IF HIS THE OWNER OF THE COMMENT
      if (comment.commentedBy.toString() !== loggedInUserId)
        return errorResponse(res, 401, "unauthorized to update comment");

      // UPDATE COMMENT
      comment.comment = newComment;
      comment.commentedBy = loggedInUserId;

      await blog.save();

      return successResponse(res, 200, "updated comment", blog);
    } catch (error) {
      console.log(error);
      errorResponse(res, 500, "error found ");
    }
  }

  /**
   * @description - THIS ENDPOINT IS USED TO DELETE COMMENT
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof commentController
   */

  static async deleteComment(req, res) {
    if (
      req.user.role !== "user" &&
      req.user.role !== "admin" &&
      req.user.role !== "superAdmin"
    )
      return errorResponse(res, 401, "unauthorized");

    const { blogId, commentId } = req.params;

    HelperFunction.isValidObjectId(blogId);

    HelperFunction.isValidObjectId(commentId);

    const loggedInUserId = req.user._id;

    try {
      const blogPost = await BlogPostModel.findById(blogId);

      if (!blogPost) return errorResponse(res, 404, "blogPost not found");

      const comment = blogPost.comments.find(
        (comment) => comment._id.toString() === commentId
      );

      if (!comment) return errorResponse(res, 404, "comment not found");

      // CHECKING IF HIS THE ORIGINAL OWNER OF THE COMMENT
      if (comment.commentedBy.toString() !== loggedInUserId.toString())
        return errorResponse(res, 401, "unauthorized to delete comment");

      // DELETE THE BLOG
      blogPost.comments.pull(comment.id);

      await blogPost.save();

      return successResponse(res, 200, "comment deleted", blogPost);
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = commentController;
