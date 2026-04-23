function evaluateAdvice(state) {
  var round = Number(state.roundNumber) || 0;
  var score = state.score || { us: 0, them: 0 };

  // Penultimate round of first half
  if (round === 11) {
    return { text: "Save for last round of half!", color: "red" };
  }

  // Either team one round from match point
  if (score.us === 11 || score.them === 11) {
    return { text: "Save for match point!", color: "red" };
  }

  return null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { evaluateAdvice };
}
