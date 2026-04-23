const displayFrame = document.querySelector(".fullscreen-embed-frame[data-display-key]");

function applyDisplayFrameConfig() {
  if (!displayFrame) {
    return;
  }

  const displayKey = displayFrame.dataset.displayKey;
  const displayConfig = window.MLHDisplayConfig.loadDisplayConfig();
  const nextUrl = displayConfig[displayKey];

  if (!nextUrl || displayFrame.src === nextUrl) {
    return;
  }

  displayFrame.src = nextUrl;
}

applyDisplayFrameConfig();

window.addEventListener(window.MLHDisplayConfig.changeEvent, () => {
  applyDisplayFrameConfig();
});

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== window.MLHDisplayConfig.storageKey) {
    return;
  }

  applyDisplayFrameConfig();
});
