// ADMIN SCHEMA
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const AdminSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    saveBlog: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BlogPost",
      },
    ],
    passwordResetToken: {
      type: String,
    },
    passwordResetTokenExpiresAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// PLUGIN PAGINATOR
AdminSchema.plugin(mongoosePaginate);

// CREATING A MODEL
const UserModel = mongoose.model("Admin", AdminSchema);

// EXPORT THE SCHEMA
module.exports = UserModel;
