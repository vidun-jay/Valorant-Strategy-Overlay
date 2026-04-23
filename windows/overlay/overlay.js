(function () {
  var container = document.getElementById("advice-container");
  var textEl = document.getElementById("advice-text");
  function showAdvice(advice) {
    if (!advice || !advice.text) {
      hideAdvice();
      return;
    }

    textEl.textContent = advice.text;
    container.setAttribute("data-color", advice.color || "blue");
    container.classList.remove("hidden");
  }

  function hideAdvice() {
    container.classList.add("hidden");
  }

  overwolf.windows.onMessageReceived.addListener(function (message) {
    if (message.id === "advice") {
      showAdvice(message.content);
    } else if (message.id === "clear") {
      hideAdvice();
    }
  });
})();
