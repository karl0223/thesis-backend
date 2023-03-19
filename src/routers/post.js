const express = require("express");
const Post = require("../models/post");
const { auth } = require("../middleware/auth");
const router = new express.Router();

// Get all post with search
// /post?page=1&limit=5&search=new post
// /post?search=new post

router.get("/api/post", auth, async (req, res) => {
  const { page: rawPage = 1, limit: rawLimit = 10, search } = req.query;

  const page = parseInt(rawPage, 10);
  const limit = parseInt(rawLimit, 10);

  if (isNaN(page) || page < 1) {
    return res.status(400).json({ message: "Invalid page parameter" });
  }

  if (isNaN(limit) || limit < 1) {
    return res.status(400).json({ message: "Invalid limit parameter" });
  }

  let filter = {};

  if (search) {
    const sanitizedSearch = sanitizeSearchString(search);
    const searchRegex = new RegExp(sanitizedSearch, "i");
    filter = {
      $or: [
        { title: searchRegex },
        { body: searchRegex },
        { subtitle: searchRegex },
      ],
    };
  }

  try {
    const totalCount = await Post.countDocuments(filter);

    if (totalCount === 0) {
      return res.status(404).json({ message: "No matching posts found" });
    }

    const totalPages = Math.ceil(totalCount / limit);

    if (page > totalPages) {
      return res.status(400).json({ message: "Page out of range" });
    }

    const posts = await Post.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ posts, totalPages, currentPage: page, totalCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Sanitization logic for search
function sanitizeSearchString(search) {
  return search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// Create Post
router.post("/api/post", auth, async (req, res) => {
  try {
    // Extract the data from the request body
    const { title, subtitle, body } = req.body;

    // Create a new Post object with the extracted data
    const newPost = new Post({
      title,
      subtitle,
      body,
      author: req.user._id,
    });

    // Save the new Post object to the database
    const post = await newPost.save();

    // Send a success response with the saved post data
    res.status(201).json({ success: true, post });
  } catch (error) {
    // Send an error response if there was a problem saving the post
    res.status(500).json({ success: false, error });
  }
});

module.exports = router;
