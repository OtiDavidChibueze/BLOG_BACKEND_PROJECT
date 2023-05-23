class ResponseHelper {
  /**
   * @description - //* THIS IS USED TO SEND A SUCCESS RESPONSE
   * @param {res} object - //* THE REQUEST OBJECT
   * @param {statusCode} number - //* THE STATUSCODE OBJECT
   * @param {message} string - //* THE MESSAGE OBJ  ECT
   * @param {data} object - //* THE DATA OBJECT
   * @returns {res}  - //* RETURNS AN OBJECT
   */

  static successResponse(res, statusCode, message, data) {
    return res.status(statusCode).json({ status: "success", message, data });
  }

  /**
   * @description - //* RETURNS A ERROR RESPONSE
   * @param {res} object - //* THE REQUEST OBJECT
   * @param {statusCode} number - //* THE STATUS CODE
   * @param {message} string - //* THE SUCCESS MESSAGE
   * @returns {object} - //* RETURNS AN OBJECT
   */

  static errorResponse(res, statusCode, message) {
    return res.status(statusCode).json({ status: false, message });
  }
}

module.exports = ResponseHelper;
