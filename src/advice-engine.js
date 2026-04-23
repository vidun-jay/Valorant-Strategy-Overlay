var FULL_BUY_COST = 3900;
var MIN_ROUND_BONUS = 1900;

function evaluateAdvice(state) {
  var round = Number(state.roundNumber) || 0;
  var score = state.score || { us: 0, them: 0 };
  var money = Number(state.localPlayerMoney) || 0;

  var moneyNextRound = money - FULL_BUY_COST + MIN_ROUND_BONUS;
  if (moneyNextRound >= FULL_BUY_COST) return null;

  if (round === 11) {
    return { text: "Save for last round of half!", color: "red" };
  }

  if (score.us === 11 || score.them === 11) {
    return { text: "Save for match point!", color: "red" };
  }

  return null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { evaluateAdvice };
}
