//* CATEGORY ROUTER
const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categories");
const { authorization } = require("../middleware/authorization");
const { validate } = require("../validation/schemaValidationHelper");

//* URL ROUTES
router.get("/", categoryController.get);

router.get("/counts", authorization, categoryController.getCategoryCounts);

router.post(
  "/create",
  authorization,
  validate(categorySchemaValidation),
  categoryController.post
);

router.get("/:id", authorization, categoryController.getCategoryById);

router.put(
  "/:id",
  authorization,
  validate(categorySchemaValidation),
  categoryController.put
);

router.delete("/:id", authorization, categoryController.delete);

module.exports = router;
