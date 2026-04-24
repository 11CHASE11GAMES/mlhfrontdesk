const displayPanels = new Map(
  Array.from(document.querySelectorAll("[data-rotation-panel-key]")).map((panel) => [
    panel.dataset.rotationPanelKey,
    panel,
  ]),
);
const displayFrames = new Map(
  Array.from(document.querySelectorAll("[data-rotation-frame-key]")).map((frame) => [
    frame.dataset.rotationFrameKey,
    frame,
  ]),
);
const REFRESH_ON_SHOW_KEYS = new Set(["announcements", "events"]);
let displayRotationTimer = null;

function clearDisplayRotationTimer() {
  if (!displayRotationTimer) {
    return;
  }

  window.clearTimeout(displayRotationTimer);
  displayRotationTimer = null;
}

function getDisplayUrl(displayKey) {
  const displayConfig = window.MLHDisplayConfig.loadDisplayConfig();
  return window.MLHDisplayConfig.getDisplayUrl(displayKey, displayConfig);
}

function loadFrame(displayKey, { force = false } = {}) {
  const frame = displayFrames.get(displayKey);

  if (!frame) {
    return;
  }

  const nextUrl = getDisplayUrl(displayKey);

  if (!nextUrl) {
    return;
  }

  if (!force && frame.dataset.loadedUrl === nextUrl) {
    return;
  }

  frame.src = nextUrl;
  frame.dataset.loadedUrl = nextUrl;
}

function ensureBaseFramesLoaded() {
  loadFrame("packages");
}

function applyActiveDisplay(displayKey) {
  const safeDisplayKey = window.MLHRotation.displayKeys.includes(displayKey)
    ? displayKey
    : "packages";

  ensureBaseFramesLoaded();

  if (REFRESH_ON_SHOW_KEYS.has(safeDisplayKey)) {
    loadFrame(safeDisplayKey, { force: true });
  } else {
    loadFrame(safeDisplayKey);
  }

  displayPanels.forEach((panel, panelKey) => {
    const isActive = panelKey === safeDisplayKey;
    panel.classList.toggle("is-active", isActive);
    panel.toggleAttribute("hidden", !isActive);
  });
}

function applyDisplayWindowState() {
  const rotationState = window.MLHRotation.loadRotationState();

  applyActiveDisplay(rotationState.currentKey);
}

function scheduleDisplayRotation() {
  clearDisplayRotationTimer();

  const rotationState = window.MLHRotation.loadRotationState();

  if (!rotationState.active || !rotationState.currentKey) {
    return;
  }

  const delayMs = Math.max(rotationState.nextAt - Date.now(), 0);

  displayRotationTimer = window.setTimeout(() => {
    const latestState = window.MLHRotation.loadRotationState();

    if (!latestState.active || !latestState.currentKey) {
      return;
    }

    window.MLHRotation.advanceRotation();
  }, delayMs);
}

function syncDisplayWindowConfig() {
  const rotationState = window.MLHRotation.loadRotationState();

  if (!rotationState.currentKey) {
    ensureBaseFramesLoaded();
    return;
  }

  if (rotationState.currentKey === "packages") {
    loadFrame("packages");
  }

  if (REFRESH_ON_SHOW_KEYS.has(rotationState.currentKey)) {
    loadFrame(rotationState.currentKey, { force: true });
  }
}

applyDisplayWindowState();
scheduleDisplayRotation();

window.addEventListener(window.MLHRotation.changeEvent, () => {
  applyDisplayWindowState();
  scheduleDisplayRotation();
});

window.addEventListener(window.MLHDisplayConfig.changeEvent, () => {
  syncDisplayWindowConfig();
  applyDisplayWindowState();
});

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== window.MLHDisplayConfig.storageKey) {
    return;
  }

  syncDisplayWindowConfig();
  applyDisplayWindowState();
});
