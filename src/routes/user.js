//* USER ROUTER
const router = require("express").Router();
const userController = require("../controller/user");
const { authorization } = require("../middleware/authorization");
const {
  UserRegisterSchemaValidation,
  UpdateUserSchemaValidation,
  resetPassword,
} = require("../validation/schema/user");
const { validate } = require("../validation/schemaValidationHelper");

router.get("/", userController.getUsers);

router.get("/counts", userController.getUserCounts);

router.get("/:id", userController.getUsersById);

router.post("/login", userController.loginUsers);

router.post("/logout", authorization, userController.logoutUsers);

router.post(
  "/register",
  validate(UserRegisterSchemaValidation),
  userController.RegisterUsers
);

router.put("/changePassword", authorization, userController.changePassword);

router.put(
  "/:id",
  validate(UpdateUserSchemaValidation),
  userController.updateUserById
);

router.delete("/:id", authorization, userController.deleteUserById);

router.post("/forgotPassword", userController.forgotPassword);

router.put(
  "/resetPassword/:tokenId",
  validate(resetPassword),
  userController.resetPassword
);

module.exports = router;
