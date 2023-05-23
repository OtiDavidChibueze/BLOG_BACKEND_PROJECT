//* VERIFY TOKEN
const jwt = require("jsonwebtoken");
const { SECRET } = require("../config/keys");
const { errorResponse } = require("../utils/responseHelper");

const authorization = (req, res, next) => {
  const token = req.cookies.user;

  try {
    //* CHECKING IF TOKEN EXISTS
    if (!token) return res.status(404).json({ message: "no token provided" });

    //* VERIFY TOKEN
    jwt.verify(
      token,
      SECRET,
      { algorithms: ["HS256"] },
      async (err, decodedToken) => {
        if (err) {
          console.log(err);

          //! TOKEN ERROR HANDLERS
          if (err.name === "TokenExpiredError") {
            //! USER HAS TO BE DIRECTED  TO THE LOGIN PAGE
            return errorResponse(res, 301, "token expired please login");
          } else {
            //! TOKEN HAS BEEN TEMPERED WITH
            return errorResponse(res, 400, "invalid Token");
          }
        } else {
          console.log(decodedToken);

          //* ASSIGNING THE REQ USER TO THE DECODED TOKEN
          req.user = {
            _id: decodedToken.userId,
            role: decodedToken.role,
          };

          if (req.user.role === "user") {
            next();
          } else if (req.user.role === "admin") {
            next();
          } else if (req.user.role === "superAdmin") {
            next();
          } else {
            res.status(400).json({ message: "unauthorized" });
          }
        }
      }
    );
  } catch (error) {
    console.log({ error });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { authorization };
