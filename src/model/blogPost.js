const mongoose = require("mongoose"); // Erase if already required
const mongoosePaginate = require("mongoose-paginate-v2");

// Declare the Schema of the Mongo model
var blogPostSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },
    description: {
      type: String,
      min: 15,
    },
    images: [],
    comments: [
      {
        comment: {
          type: String,
        },
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    like: {
      type: Boolean,
      default: false,
    },
    dislike: {
      type: Boolean,
      default: false,
    },
    likedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    numberOfView: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// PLUGIN MONGOOSE PAGINATE
blogPostSchema.plugin(mongoosePaginate);

//Export the model
module.exports = mongoose.model("BlogPost", blogPostSchema);
