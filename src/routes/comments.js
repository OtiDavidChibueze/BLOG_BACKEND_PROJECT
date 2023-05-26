//* BLOG ROUTER
const router = require("express").Router();
const commentController = require("../controller/comments");
const { authorization } = require("../middleware/authorization");

router.get(
  "/:blogPostId/comments",
  authorization,
  commentController.getCommentsForASpecificBlogPost
);

router.post(
  "/comment/:blogId",
  authorization,
  commentController.commentToBlogPost
);

router.put(
  "/:blogId/update/:commentId",
  authorization,
  commentController.updateComment
);

router.delete(
  "/:blogId/delete/:commentId",
  authorization,
  commentController.deleteComment
);

module.exports = router;
