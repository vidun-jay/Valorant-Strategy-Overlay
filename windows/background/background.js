(function () {
  const gameState = {
    roundPhase: null,
    roundNumber: 0,
    score: { us: 0, them: 0 },
    localPlayerMoney: 0,
    lastRoundResult: null,
  };

  const VALORANT_GAME_ID = 21640;
  const REQUIRED_FEATURES = ["match_info", "me", "game_info", "kill", "death"];
  const FEATURE_RETRY_INTERVAL = 2000;
  const MAX_FEATURE_RETRIES = 20;

  let overlayWindowId = null;

  function init() {
    openOverlayWindow();
    registerEvents();
    setRequiredFeaturesWithRetry(0);
  }

  function openOverlayWindow() {
    overwolf.windows.obtainDeclaredWindow("overlay", function (result) {
      if (result.success) {
        overlayWindowId = result.window.id;
        overwolf.windows.restore(overlayWindowId);
      }
    });
  }

  function setRequiredFeaturesWithRetry(attempt) {
    overwolf.games.events.setRequiredFeatures(
      REQUIRED_FEATURES,
      function (result) {
        if (!result.success && attempt < MAX_FEATURE_RETRIES) {
          setTimeout(function () {
            setRequiredFeaturesWithRetry(attempt + 1);
          }, FEATURE_RETRY_INTERVAL);
        }
      }
    );
  }

  function registerEvents() {
    overwolf.games.events.onInfoUpdates2.addListener(handleInfoUpdate);
    overwolf.games.events.onNewEvents.addListener(handleNewEvent);
  }

  function handleInfoUpdate(info) {
    try {
      if (info.info && info.info.match_info && info.info.match_info.round_phase) {
        onPhaseChange(info.info.match_info.round_phase);
      }

      if (info.info && info.info.match_info && info.info.match_info.round_number !== undefined) {
        gameState.roundNumber = parseInt(info.info.match_info.round_number, 10);
      }

      if (info.info && info.info.match_info && info.info.match_info.score) {
        parseScore(info.info.match_info.score);
      }

      if (info.info && info.info.me && info.info.me.money) {
        gameState.localPlayerMoney = parseInt(info.info.me.money, 10);
      }

      var oldMoney = gameState.localPlayerMoney;
      if (info.info && info.info.match_info) {
        parseScoreboards(info.info.match_info);
      }

      if (gameState.roundPhase === "shopping" && gameState.localPlayerMoney !== oldMoney) {
        var advice = evaluateAdvice(gameState);
        if (advice) {
          sendToOverlay("advice", advice);
        }
      }
    } catch (e) {
      console.error("[BG] processInfoUpdate error:", e);
    }
  }

  function handleNewEvent(eventsData) {
    if (!eventsData || !eventsData.events) return;

    eventsData.events.forEach(function (ev) {
      switch (ev.name) {
        case "match_start":
          resetState();
          break;
        case "match_end":
          resetState();
          sendToOverlay("clear", null);
          break;
        case "round_start":
          if (ev.data) {
            var parsed = tryParseJSON(ev.data);
            if (parsed && parsed.round_number) {
              gameState.roundNumber = parseInt(parsed.round_number, 10);
            }
          }
          break;
      }
    });
  }

  function onPhaseChange(newPhase) {
    var oldPhase = gameState.roundPhase;
    gameState.roundPhase = newPhase;

    if (newPhase === oldPhase) return;

    if (newPhase === "shopping") {
      var advice = evaluateAdvice(gameState);
      if (advice) {
        sendToOverlay("advice", advice);
      }
    } else if (newPhase === "combat") {
      sendToOverlay("clear", null);
    }
  }

  function parseScore(scoreData) {
    var data = tryParseJSON(scoreData) || scoreData;
    if (typeof data === "object" && data !== null) {
      if ("won" in data) gameState.score.us = parseInt(data.won, 10);
      if ("lost" in data) gameState.score.them = parseInt(data.lost, 10);
      if ("us" in data) gameState.score.us = parseInt(data.us, 10);
      if ("them" in data) gameState.score.them = parseInt(data.them, 10);
    } else if (typeof data === "string") {
      var parts = data.split("/");
      if (parts.length === 2) {
        gameState.score.us = parseInt(parts[0], 10);
        gameState.score.them = parseInt(parts[1], 10);
      }
    }
  }

  function parseScoreboards(matchInfo) {
    for (var i = 0; i <= 9; i++) {
      var key = "scoreboard_" + i;
      if (!matchInfo[key]) continue;
      var player = tryParseJSON(matchInfo[key]);
      if (!player) continue;

      if (player.is_local && player.money !== undefined) {
        gameState.localPlayerMoney = parseInt(player.money, 10);
      }
    }
  }

  function tryParseJSON(str) {
    if (typeof str !== "string") return str;
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }

  function resetState() {
    gameState.roundPhase = null;
    gameState.roundNumber = 0;
    gameState.score.us = 0;
    gameState.score.them = 0;
    gameState.localPlayerMoney = 0;
    gameState.lastRoundResult = null;
  }

  function sendToOverlay(id, content) {
    if (!overlayWindowId) return;
    overwolf.windows.sendMessage(overlayWindowId, id, content, function () {});
  }

  init();
})();
