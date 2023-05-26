//* SUPER ADMIN ROUTER
const router = require("express").Router();
const superAdminsController = require("../controller/superAdmin");
const { authorization } = require("../middleware/authorization");
const {
  UserRegisterSchemaValidation,
  UpdateUserSchemaValidation,
  resetPassword,
} = require("../validation/schema/user");
const { blogCreationSchema } = require("../validation/schema/blogPost");
const { validate } = require("../validation/schemaValidationHelper");

router.get("/", authorization, superAdminsController.getSuperAdmins);

router.get("/getProfile", authorization, superAdminsController.getProfile);

router.get("/counts", authorization, superAdminsController.getSuperAdminCounts);

router.get(
  "/savedBlog/list",
  authorization,
  superAdminsController.getSavedList
);

router.get("/:id", authorization, superAdminsController.getSuperAdminsById);

router.post("/login", superAdminsController.loginSuperAdmins);

router.put(
  "/updateProfile",
  authorization,
  validate(UpdateUserSchemaValidation),
  superAdminsController.updateProfile
);

router.post("/logout", authorization, superAdminsController.logoutSuperAdmins);

router.post(
  "/register",
  authorization,
  validate(UserRegisterSchemaValidation),
  superAdminsController.RegisterSuperAdmins
);

router.put(
  "/changePassword",
  authorization,
  superAdminsController.changePassword
);

router.put(
  "/:id",
  authorization,
  validate(UpdateUserSchemaValidation),
  superAdminsController.updateSuperAdminById
);

router.delete(
  "/:id",
  authorization,
  superAdminsController.deleteSuperAdminById
);

router.post("/forgotPassword", superAdminsController.forgotPassword);

router.put(
  "/resetPassword/:tokenId",
  validate(resetPassword),
  superAdminsController.resetPassword
);

router.post(
  "/save/remove/blogPost/fromList",
  authorization,
  superAdminsController.saveBlogToList
);

module.exports = router;
