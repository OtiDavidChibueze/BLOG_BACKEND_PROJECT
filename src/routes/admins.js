//* ADMIN ROUTER
const router = require("express").Router();
const adminController = require("../controller/admins");
const { authorization } = require("../middleware/authorization");
const {
  UserRegisterSchemaValidation,
  UpdateUserSchemaValidation,
  resetPassword,
} = require("../validation/schema/user");
const { validate } = require("../validation/schemaValidationHelper");

router.get("/", authorization, adminController.getAdmins);

router.get("/getProfile", authorization, adminController.getProfile);

router.get("/counts", authorization, adminController.getAdminCounts);

router.get("/savedBlog/list", authorization, adminController.getSavedList);

router.get("/:id", authorization, adminController.getAdminsById);

router.post("/login", adminController.loginAdmins);

router.put(
  "/updateProfile",
  authorization,
  validate(UpdateUserSchemaValidation),
  adminController.updateProfile
);

router.post("/logout", authorization, adminController.logoutAdmins);

router.post(
  "/register",
  authorization,
  validate(UserRegisterSchemaValidation),
  adminController.RegisterAdmins
);

router.put("/changePassword", authorization, adminController.changePassword);

router.put(
  "/:id",
  authorization,
  validate(UpdateUserSchemaValidation),
  adminController.updateAdminById
);

router.delete("/:id", authorization, adminController.deleteAdminById);

router.post("/forgotPassword", adminController.forgotPassword);

router.put(
  "/resetPassword/:tokenId",
  validate(resetPassword),
  adminController.resetPassword
);

router.post(
  "/save/remove/blogPost/fromList",
  authorization,
  adminController.saveBlogToList
);

module.exports = router;
