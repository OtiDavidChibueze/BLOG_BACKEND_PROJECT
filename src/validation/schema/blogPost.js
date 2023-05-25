//* BLOG SCHEMA
const joi = require("joi");

const blogCreationSchema = joi.object(
  {
    title: joi.string().required(),
    description: joi.string().required().min(15),
    images: joi.array(),
    postedBy: joi.string().regex(/^[a-fA-F0-9]{24}$/),
  },
  { stripUnknown: true }
);

module.exports.blogCreationSchema = blogCreationSchema;

//* BLOG SCHEMA UPDATE

const blogUpdateSchema = joi.object(
  {
    title: joi.string(),
    description: joi.string().min(15),
    images: joi.array(),
  },
  { stripUnknown: true }
);

module.exports.blogUpdateSchema = blogUpdateSchema;
