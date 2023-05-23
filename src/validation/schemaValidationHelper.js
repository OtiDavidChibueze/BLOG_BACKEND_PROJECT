const { errorResponse } = require("../utils/responseHelper");

class Validation {
  /**
   *@description - //* THIS IS THE VALIDATION INPUT
   @param {object} joi - //* THE VALIDATION USED
   @param {schema} object - //* THE SCHEMA TO BE VALIDATED 
   @return {boolean} - //* RETURNS A BOOLEAN
   @memberof Validation
   */

  static validateInput(schema, object) {
    const { error, value } = schema.validate(object);
    return { error, value };
  }

  /**
   *@description - //* VALIDATING THE OBJECT SCHEMA
   @param {schema} object - //* THE SCHEMA OBJECT
   @param {req} object - //* THE REQUEST OBJECT
   @param {res} object - //* THE RESPONSE OBJECT
   @param {next} object - //* THE NEXT OBJECT
   @return {message} - //* RETURNS AN ERROR MESSAGE IF ERROR FOUND DURING VALIDATION
   @memberof Validation
   */

  static validate(schema) {
    return (req, res, next) => {
      const { error } = Validation.validateInput(schema, {
        ...req.body,
        ...req.query,
      });

      if (!error) {
        return next();
      }

      errorResponse(res, 422, error.details[0].message);
    };
  }
}

module.exports = Validation;
