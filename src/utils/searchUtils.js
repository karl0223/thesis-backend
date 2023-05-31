import Search from "../models/search.js";

function normalizeText(text) {
  return text.toLowerCase().replace(/[^\w]+/g, "");
}

function countTerms(terms) {
  const termCounts = {};

  for (const term of terms) {
    if (termCounts[term]) {
      termCounts[term]++;
    } else {
      termCounts[term] = 1;
    }
  }

  return termCounts;
}

async function termCounts(searchTerms) {
  // Count the terms and add them to the search term collection
  const termCounts = countTerms(searchTerms);
  for (const term in termCounts) {
    await Search.updateOne(
      { term: term },
      { $inc: { count: termCounts[term] }, $setOnInsert: { term: term } },
      { upsert: true }
    );
  }
}

const combinedSearchTerms = async (searchTerms) => {
  const combinedSearchTerms = [];
  let combinedTerm = "";

  for (let i = 0; i < searchTerms.length; i++) {
    const term = searchTerms[i];

    if (isNaN(term)) {
      // If the term is a string
      if (combinedTerm !== "") {
        // If there are previous combined terms, push them to the result array
        combinedSearchTerms.push(combinedTerm.trim());
        combinedTerm = "";
      }
      combinedTerm += " " + term;
    } else {
      // If the term is a number
      combinedTerm += " " + term;
    }
  }

  if (combinedTerm !== "") {
    // Push the last combined term if any
    combinedSearchTerms.push(combinedTerm.trim());
  }

  return combinedSearchTerms;
};

export { normalizeText, countTerms, termCounts, combinedSearchTerms };
