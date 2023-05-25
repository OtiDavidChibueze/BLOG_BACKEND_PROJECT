//* BLOG ROUTER
const router = require("express").Router();
const blogController = require("../controller/blogPost");
const { validate } = require("../validation/schemaValidationHelper");
const { blogUpdateSchema } = require("../validation/schema/blogPost");
const { authorization } = require("../middleware/authorization");

router.get("/", authorization, blogController.getBlogs);

router.get("/:id", authorization, blogController.getBlogsById);

router.put(
  "/:id",
  authorization,
  validate(blogUpdateSchema),
  blogController.updateBlogsById
);

router.delete("/:id", blogController.deleteBlogsById);

router.post(
  "/like/Or/Dislike/BlogPost",
  authorization,
  blogController.likeBlogPostOrDislike
);

router.post("/comment", authorization, blogController.commentToBlogPost);

module.exports = router;
