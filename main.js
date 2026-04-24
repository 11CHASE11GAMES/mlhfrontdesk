const HOME_WINDOW_NAME = "mlh-frontdesk-home";
const links = Array.from(document.querySelectorAll(".wheel-link"));
const wheelCopy = document.querySelector(".wheel-copy");
const selectedTitle = document.querySelector("#selected-title");
const selectedDescription = document.querySelector("#selected-description");
const statusPill = document.querySelector(".status-pill");
const autoRotationButton = document.querySelector("#auto-rotation-button");
const autoRotationStatus = document.querySelector("#auto-rotation-status");

window.name = HOME_WINDOW_NAME;

const defaultTitle = wheelCopy.dataset.defaultTitle;
const defaultDescription = wheelCopy.dataset.defaultDescription;

function getRotationLink(displayKey) {
  return links.find((link) => link.dataset.displayKey === displayKey) ?? null;
}

function setPreview(link) {
  selectedTitle.textContent = link.dataset.title;
  selectedDescription.textContent = link.dataset.description;
}

function resetPreview() {
  selectedTitle.textContent = defaultTitle;
  selectedDescription.textContent = defaultDescription;
}

function getActiveRotationLink() {
  const rotationState = window.MLHRotation.loadRotationState();

  if (!rotationState.active) {
    return null;
  }

  return getRotationLink(rotationState.currentKey);
}

function restorePreviewAfterHover() {
  const activeRotationLink = getActiveRotationLink();

  if (activeRotationLink) {
    setPreview(activeRotationLink);
    return;
  }

  resetPreview();
}

function updateRotationUi() {
  const rotationState = window.MLHRotation.loadRotationState();
  const activeRotationLink = rotationState.active
    ? getRotationLink(rotationState.currentKey)
    : null;

  if (autoRotationButton) {
    autoRotationButton.textContent = "Start Rotation";
    autoRotationButton.dataset.state = rotationState.active ? "running" : "idle";
    autoRotationButton.disabled = rotationState.active;
  }

  if (autoRotationStatus) {
    autoRotationStatus.textContent = activeRotationLink
      ? activeRotationLink.dataset.title
      : "Off";
    autoRotationStatus.dataset.state = rotationState.active ? "running" : "idle";
  }

  if (statusPill) {
    statusPill.textContent = rotationState.active ? "Auto-Rotating" : "Home";
  }
}

links.forEach((link) => {
  link.addEventListener("mouseenter", () => setPreview(link));
  link.addEventListener("focus", () => setPreview(link));
  link.addEventListener("mouseleave", restorePreviewAfterHover);
  link.addEventListener("blur", restorePreviewAfterHover);

  link.addEventListener("click", (event) => {
    const displayKey = link.dataset.displayKey;

    if (!window.MLHRotation.displayKeys.includes(displayKey)) {
      return;
    }

    event.preventDefault();
    setPreview(link);
    window.MLHRotation.stopRotation();

    if (!window.MLHRotation.openDisplayByKey(displayKey)) {
      return;
    }
  });
});

autoRotationButton?.addEventListener("click", () => {
  if (!window.MLHRotation.startRotation()) {
    autoRotationStatus.textContent = "Blocked";
    autoRotationStatus.dataset.state = "idle";
    return;
  }

  restorePreviewAfterHover();
  updateRotationUi();
});

updateRotationUi();
restorePreviewAfterHover();

window.addEventListener(window.MLHRotation.changeEvent, () => {
  updateRotationUi();
  restorePreviewAfterHover();
});
