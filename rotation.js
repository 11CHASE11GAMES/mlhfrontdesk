const ROTATION_STATE_STORAGE_KEY = "mlh-display-rotation-state";
const ROTATION_CHANGE_EVENT = "msoe-display-rotation-change";
const ROTATION_CHANNEL_NAME = "msoe-display-rotation";
const DISPLAY_WINDOW_NAME = "mlh-frontdesk-display";
const DISPLAY_WINDOW_DESTINATION = "display.html";
const ROTATION_ORDER = Object.freeze(["packages", "announcements", "events"]);
const ROTATION_DURATION_FIELDS = Object.freeze({
  packages: "rotationPackagesSeconds",
  announcements: "rotationAnnouncementsSeconds",
  events: "rotationEventsSeconds",
});

let rotationChannel = null;
let displayWindowRef = null;

if (typeof BroadcastChannel !== "undefined") {
  rotationChannel = new BroadcastChannel(ROTATION_CHANNEL_NAME);
  rotationChannel.addEventListener("message", (event) => {
    const normalizedState = normalizeRotationState(event.data);
    window.dispatchEvent(
      new CustomEvent(ROTATION_CHANGE_EVENT, {
        detail: normalizedState,
      }),
    );
  });
}

function normalizeRotationState(rawState = {}) {
  const currentKey = ROTATION_ORDER.includes(rawState.currentKey) ? rawState.currentKey : "";
  const nextAt = Number(rawState.nextAt);
  const active = Boolean(rawState.active) && Boolean(currentKey);

  return {
    active,
    currentKey,
    nextAt: active && Number.isFinite(nextAt) ? nextAt : 0,
  };
}

function loadRotationState() {
  try {
    const rawValue = localStorage.getItem(ROTATION_STATE_STORAGE_KEY);

    if (!rawValue) {
      return normalizeRotationState();
    }

    return normalizeRotationState(JSON.parse(rawValue));
  } catch {
    return normalizeRotationState();
  }
}

function notifyRotationChange(nextState) {
  window.dispatchEvent(
    new CustomEvent(ROTATION_CHANGE_EVENT, {
      detail: nextState,
    }),
  );

  if (rotationChannel) {
    rotationChannel.postMessage(nextState);
  }
}

function saveRotationState(nextState) {
  const normalizedState = normalizeRotationState(nextState);
  localStorage.setItem(ROTATION_STATE_STORAGE_KEY, JSON.stringify(normalizedState));
  notifyRotationChange(normalizedState);
  return normalizedState;
}

function getRotationDurationMs(displayKey) {
  const currentConfig = window.MLHDisplayConfig.loadDisplayConfig();
  const durationFieldName = ROTATION_DURATION_FIELDS[displayKey];
  const durationSeconds = Number(currentConfig[durationFieldName] ?? 0);

  if (!Number.isFinite(durationSeconds)) {
    return 60000;
  }

  return durationSeconds * 1000;
}

function getNextDisplayKey(currentKey = "") {
  const currentIndex = ROTATION_ORDER.indexOf(currentKey);

  if (currentIndex < 0) {
    return ROTATION_ORDER[0];
  }

  return ROTATION_ORDER[(currentIndex + 1) % ROTATION_ORDER.length];
}

function getExistingDisplayWindow() {
  if (displayWindowRef && !displayWindowRef.closed) {
    return displayWindowRef;
  }

  const namedWindow = window.open("", DISPLAY_WINDOW_NAME);

  if (!namedWindow) {
    return null;
  }

  displayWindowRef = namedWindow;
  return namedWindow;
}

function openDisplayWindow() {
  const displayWindow = getExistingDisplayWindow();

  if (!displayWindow) {
    return null;
  }

  try {
    if (displayWindow.location.href === "about:blank") {
      displayWindow.location.replace(DISPLAY_WINDOW_DESTINATION);
    }
  } catch {
    const reopenedWindow = window.open(DISPLAY_WINDOW_DESTINATION, DISPLAY_WINDOW_NAME);

    if (!reopenedWindow) {
      return null;
    }

    displayWindowRef = reopenedWindow;
    reopenedWindow.focus();
    return reopenedWindow;
  }

  displayWindow.focus();
  return displayWindow;
}

function showDisplay(displayKey, { active = false } = {}) {
  if (!ROTATION_ORDER.includes(displayKey)) {
    return false;
  }

  const displayWindow = openDisplayWindow();

  if (!displayWindow) {
    return false;
  }

  saveRotationState({
    active,
    currentKey: displayKey,
    nextAt: active ? Date.now() + getRotationDurationMs(displayKey) : 0,
  });

  return true;
}

function openDisplayByKey(displayKey) {
  return showDisplay(displayKey, { active: false });
}

function startRotation() {
  return showDisplay(ROTATION_ORDER[0], { active: true });
}

function stopRotation() {
  const currentState = loadRotationState();

  return saveRotationState({
    active: false,
    currentKey: currentState.currentKey,
    nextAt: 0,
  });
}

function advanceRotation() {
  const currentState = loadRotationState();
  const nextDisplayKey = getNextDisplayKey(currentState.currentKey);

  return saveRotationState({
    active: true,
    currentKey: nextDisplayKey,
    nextAt: Date.now() + getRotationDurationMs(nextDisplayKey),
  });
}

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== ROTATION_STATE_STORAGE_KEY) {
    return;
  }

  notifyRotationChange(loadRotationState());
});

window.MLHRotation = {
  changeEvent: ROTATION_CHANGE_EVENT,
  displayKeys: ROTATION_ORDER,
  loadRotationState,
  saveRotationState,
  startRotation,
  stopRotation,
  advanceRotation,
  getNextDisplayKey,
  getRotationDurationMs,
  openDisplayWindow,
  openDisplayByKey,
};
