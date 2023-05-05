import mongoose from "mongoose";

const SearchSchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Search = mongoose.model("Search", SearchSchema);

export default Search;
