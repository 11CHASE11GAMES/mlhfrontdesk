const DEFAULT_DORM_LABEL = "MSOE Dorm";

function getDormLabel(config = window.MLHDisplayConfig.loadDisplayConfig()) {
  return config.dorm || DEFAULT_DORM_LABEL;
}

function applyHomeWheelBranding(dormLabel, selectedDorm) {
  const wheelTitle = document.querySelector("#wheel-title");
  const wheelDescription = document.querySelector("#wheel-description");
  const centerTitle = document.querySelector("#wheel-center-title");
  const centerSubtitle = document.querySelector("#wheel-center-subtitle");
  const nav = document.querySelector("[data-dorm-nav-label]");

  if (nav) {
    nav.setAttribute("aria-label", `${dormLabel} display pages`);
  }

  if (wheelTitle) {
    wheelTitle.textContent = `${dormLabel} display navigation wheel`;
  }

  if (wheelDescription) {
    wheelDescription.textContent =
      `A circular menu with selectable slices for ${dormLabel} front desk display pages.`;
  }

  if (!centerTitle || !centerSubtitle) {
    return;
  }

  if (selectedDorm) {
    centerTitle.textContent = selectedDorm;
    centerTitle.setAttribute("y", "8");
    centerTitle.classList.add("is-single-line");
    centerTitle.classList.toggle("is-wide", selectedDorm.length > 4);
    centerSubtitle.textContent = "";
    centerSubtitle.classList.add("is-hidden");
    return;
  }

  centerTitle.textContent = "MSOE";
  centerTitle.setAttribute("y", "-6");
  centerTitle.classList.remove("is-single-line", "is-wide");
  centerSubtitle.textContent = "Dorm";
  centerSubtitle.classList.remove("is-hidden");
}

function applyDormBranding(config = window.MLHDisplayConfig.loadDisplayConfig()) {
  const dormLabel = getDormLabel(config);
  const pageTitleSuffix = document.body.dataset.pageTitleSuffix;

  if (pageTitleSuffix) {
    document.title = `${dormLabel} ${pageTitleSuffix}`;
  }

  document.querySelectorAll("[data-dorm-name]").forEach((element) => {
    element.textContent = dormLabel;
  });

  document.querySelectorAll("[data-dorm-display]").forEach((element) => {
    element.textContent = `${dormLabel} Display`;
  });

  document.querySelectorAll("[data-frame-title-suffix]").forEach((element) => {
    element.title = `${dormLabel} ${element.dataset.frameTitleSuffix}`;
  });

  applyHomeWheelBranding(dormLabel, config.dorm);
}

applyDormBranding();

window.addEventListener(window.MLHDisplayConfig.changeEvent, (event) => {
  applyDormBranding(event.detail);
});

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== window.MLHDisplayConfig.storageKey) {
    return;
  }

  applyDormBranding();
});

window.MLHDormBranding = {
  applyDormBranding,
  applySavedBranding: applyDormBranding,
  getDormLabel,
};
