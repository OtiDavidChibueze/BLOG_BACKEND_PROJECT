//* CATEGORY SCHEMA VALIDATION
const joi = require("joi");

module.exports.categorySchemaValidation = joi
  .object({
    title: joi.string().required().min(3).max(20),
    icon: joi.string(),
    color: joi.string(),
  })
  .options({ stripUnknown: true });
