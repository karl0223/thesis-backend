import Search from "../models/search.js";

function normalizeText(text) {
  return text.toLowerCase().replace(/[^\w]+/g, "");
}

function countTerms(terms) {
  const termCounts = {};

  for (const term of terms) {
    const normalizedTerm = normalizeText(term);

    if (termCounts[normalizedTerm]) {
      termCounts[normalizedTerm]++;
    } else {
      termCounts[normalizedTerm] = 1;
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

export { normalizeText, countTerms, termCounts };
