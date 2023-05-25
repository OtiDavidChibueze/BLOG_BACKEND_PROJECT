//* USER ROUTER
const router = require("express").Router();
const usersController = require("../controller/user");
const { authorization } = require("../middleware/authorization");
const {
  UserRegisterSchemaValidation,
  UpdateUserSchemaValidation,
  resetPassword,
} = require("../validation/schema/user");
const { blogCreationSchema } = require("../validation/schema/blogPost");
const { validate } = require("../validation/schemaValidationHelper");

router.get("/", authorization, usersController.getUsers);

router.get("/getProfile", authorization, usersController.getProfile);

router.get("/counts", authorization, usersController.getUserCounts);

router.get("/savedBlog/list", authorization, usersController.getSavedList);

router.get("/:id", authorization, usersController.getUsersById);

router.post("/login", usersController.loginUsers);

router.put(
  "/updateProfile",
  authorization,
  validate(UpdateUserSchemaValidation),
  usersController.updateProfile
);

router.post("/logout", authorization, usersController.logoutUsers);

router.post(
  "/register",
  authorization,
  validate(UserRegisterSchemaValidation),
  usersController.RegisterUsers
);

router.put("/changePassword", authorization, usersController.changePassword);

router.put(
  "/:id",
  authorization,
  validate(UpdateUserSchemaValidation),
  usersController.updateUserById
);

router.delete("/:id", authorization, usersController.deleteUserById);

router.post("/forgotPassword", usersController.forgotPassword);

router.put(
  "/resetPassword/:tokenId",
  validate(resetPassword),
  usersController.resetPassword
);

router.post(
  "/save/remove/blogPost/fromList",
  authorization,
  usersController.saveBlogToList
);

router.post(
  "/create",
  authorization,
  validate(blogCreationSchema),
  usersController.createBlogs
);

module.exports = router;
