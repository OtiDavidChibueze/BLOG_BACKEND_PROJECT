//* CATEGORY CONTROLLER
const CategoryModel = require("../model/categories");
const mongoose = require("mongoose");
const HelperFunction = require("../utils/helperFunction");
const { successResponse, errorResponse } = require("../utils/responseHelper");

//* CATEGORY END POINTS

class categoryController {
  /**
   * @description - THIS ENDPOINT IS USE TO GET ALL CATEGORIES
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof categoryController
   */

  static async get(req, res) {
    try {
      const options = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 5,
        sort: { createdAt: -1 },
      };

      //* ADDING A SEARCH BAR TO THE QUERY
      const search = req.query.search;

      //* LOOKING FOR THE SEARCHED ITEM AND ADDING AN IF STATEMENT
      const query = search ? { title: { $regex: search, $options: "i" } } : {};
      const result = await CategoryModel.paginate(query, options);

      //* ADDING THE NEXT PAGE URL
      const nextPage = result.hasNextPage
        ? `${req.baseUrl}?page=${result.nextPage}`
        : null;

      //* ADDING THE PREV PAGE URL
      const prevPage = result.hasPrevPage
        ? `${req.baseUrl}?page=${result.prevPage}`
        : null;

      //* SENDING A SUCCESS RESPOND THE CLIENT
      return res.status(200).json({
        result: result.docs,
        nextPage: nextPage,
        prevPage: prevPage,
      });
    } catch (error) {
      console.log(error);
      return errorResponse(res, 500, "server error");
    }
  }

  /**
   * @description - THIS ENDPOINT IS USE TO GET ALL CATEGORY COUNT
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof categoryController
   */

  static async getCategoryCounts(req, res) {
    //* GET COUNTS
    const counts = await CategoryModel.countDocuments();

    //* IF THERE'S NOT CATEGORY
    if (!counts) {
      return errorResponse(res, 404, 0);
    } else {
      //* SEND ALL CATEGORY COUNTS TO THE CLIENT
      return successResponse(res, 200, counts);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USE TO GET A SPECIFIC CATEGORY BY ITS ID
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof categoryController
   */

  static async getCategoryById(req, res) {
    //* CHECKING IF ITS A VALID

    //* CHECKING IF ITS A VALID ID
    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    //* FIND THE CATEGORY BY ID
    const category = await CategoryModel.findById({ _id: req.params.id })
      .select("-_id title icon color")
      .sort({
        createdAT: -1,
      });

    //* IF THE CATEGORY IS NOT FOUND
    if (!category) {
      return errorResponse(res, 404, "category not found");
    } else {
      //* SEND THE CATEGORY TO THE CLIENT
      return successResponse(res, 200, category);
    }
  }
  w;

  /**
   * @description - THIS ENDPOINT IS USE TO CREATE CATEGORIES
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof categoryController
   */

  static async post(req, res) {
    //* DETAILS IN THE BODY
    const { title, icon, color } = req.body;

    //* CHECK IF THE CATEGORY EXISTS BEFORE CREATING
    const categoryExist = await CategoryModel.findOne({ title });

    if (categoryExist)
      return res.status(400).json({ message: "category already exists" });

    const category = new CategoryModel({ title, icon, color });

    //* SAVE THE CATEGORY TO THE DATA BASE
    await category.save();

    //* IF ITS NOT CREATED
    if (!category) {
      return errorResponse(res, 500, "server error");
    } else {
      //* SEND THE CREATED CATEGORY TO THE CLIENT
      return successResponse(res, 201, "created", category);
    }
  }

  /**
   * @description - THIS ENDPOINT IS USE TO UPDATE CREATED CATEGORIES
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof categoryController
   */

  static async put(req, res) {
    //* CHECKING IF ITS A VALID ID
    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    //* UPDATING THE CATEGORY
    const updateCategory = await CategoryModel.findByIdAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );

    //* IF ITS NOT UPDATED
    if (!updateCategory) {
      return res
        .status(500)
        .json({ message: "internet error , category not updated" });
    } else {
      //* SEND THE UPDATED CATEGORY TO THE CLIENT
      return res.status(200).send({ updated: updateCategory });
    }
  }

  /**
   * @description - THIS ENDPOINT IS USE TO DELETE CREATED CATEGORIES
   * @param {object} req - THE REQUEST OBJECT
   * @param {object} res - THE RESPONSE OBJECT
   * @returns {object} - RETURNS A MESSAGE
   * @memberof categoryController
   */

  static async delete(req, res) {
    //* CHECKING IF ITS A VALID ID
    const { id } = req.params;

    HelperFunction.isValidObjectId(id);

    //* DELETING THE CATEGORY
    const delCategory = await CategoryModel.findByIdAndDelete({
      _id: req.params.id,
    });

    //* IF ITS NOT DELETED
    if (!delCategory) {
      return res.status(500).json("category not deleted");
    } else {
      //* SEND A SUCCESS RESPOND TO THE CLIENT
      return res
        .status(200)
        .json({ success: true, message: "deleted category" });
    }
  }
}

module.exports = categoryController;
