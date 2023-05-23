//* USER SCHEMA VALIDATIONS
const joi = require("joi");

module.exports.UserRegisterSchemaValidation = joi
  .object({
    userName: joi.string().required().min(3).max(20),
    email: joi.string().email().required().lowercase(),
    password: joi.string().required().min(5).max(20),
    country: joi.string().required(),
    city: joi.string().required(),
    mobile: joi
      .string()
      .regex(/^0[0-9]{10}$/)
      .min(11)
      .max(11)
      .required(),
  })
  .options({ stripUnknown: true });

// UPDATE USER SCHEMA
module.exports.UpdateUserSchemaValidation = joi
  .object({
    userName: joi.string().required(),
    country: joi.string().required(),
    city: joi.string().required(),
    mobile: joi
      .string()
      .regex(/^0[0-9]{10}$/)
      .min(11)
      .max(11)
      .required(),
  })
  .options({ stripUnknown: true });

// VALIDATE RESET PASSWORD SCHEMA
module.exports.resetPassword = joi
  .object({
    newPassword: joi.string().min(6).max(20).required(),
  })
  .options({ stripUnknown: true });
