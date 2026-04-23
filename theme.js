const THEME_OVERLAY_SELECTOR = ".settings-theme-preview";
const THEME_OVERLAY_MARKUP = `
  <div class="settings-theme-preview" aria-hidden="true">
    <div class="settings-theme-art settings-theme-art-summer">
      <div class="settings-summer-glow"></div>
      <div class="settings-summer-sun"></div>
      <div class="settings-summer-palm">
        <span class="settings-summer-trunk"></span>
        <div class="settings-summer-crown">
          <span class="settings-summer-leaf settings-summer-leaf-a"></span>
          <span class="settings-summer-leaf settings-summer-leaf-b"></span>
          <span class="settings-summer-leaf settings-summer-leaf-c"></span>
          <span class="settings-summer-leaf settings-summer-leaf-d"></span>
        </div>
      </div>
      <div class="settings-summer-sand"></div>
    </div>

    <div class="settings-theme-art settings-theme-art-winter">
      <div class="settings-winter-flake settings-winter-flake-a"></div>
      <div class="settings-winter-flake settings-winter-flake-b"></div>
      <div class="settings-winter-flake settings-winter-flake-c"></div>
      <div class="settings-winter-flake settings-winter-flake-d"></div>
      <div class="settings-winter-snowman">
        <span class="settings-winter-body settings-winter-body-large"></span>
        <span class="settings-winter-body settings-winter-body-small"></span>
        <span class="settings-winter-eye settings-winter-eye-left"></span>
        <span class="settings-winter-eye settings-winter-eye-right"></span>
        <span class="settings-winter-nose"></span>
        <span class="settings-winter-scarf"></span>
      </div>
      <div class="settings-winter-snow"></div>
    </div>

    <div class="settings-theme-art settings-theme-art-autumn">
      <div class="settings-autumn-branch"></div>
      <div class="settings-autumn-leaf settings-autumn-leaf-a"></div>
      <div class="settings-autumn-leaf settings-autumn-leaf-b"></div>
      <div class="settings-autumn-leaf settings-autumn-leaf-c"></div>
      <div class="settings-autumn-pumpkin">
        <span class="settings-autumn-pumpkin-seam settings-autumn-pumpkin-seam-a"></span>
        <span class="settings-autumn-pumpkin-seam settings-autumn-pumpkin-seam-b"></span>
        <span class="settings-autumn-stem"></span>
      </div>
      <div class="settings-autumn-ground"></div>
    </div>

    <div class="settings-theme-art settings-theme-art-spring">
      <div class="settings-spring-cloud"></div>
      <div class="settings-spring-butterfly settings-spring-butterfly-a"></div>
      <div class="settings-spring-butterfly settings-spring-butterfly-b"></div>
      <div class="settings-spring-flower settings-spring-flower-a"></div>
      <div class="settings-spring-flower settings-spring-flower-b"></div>
      <div class="settings-spring-flower settings-spring-flower-c"></div>
      <div class="settings-spring-grass"></div>
    </div>
  </div>
`;

function ensureThemeOverlay() {
  if (document.querySelector(THEME_OVERLAY_SELECTOR)) {
    return;
  }

  document.body.insertAdjacentHTML("afterbegin", THEME_OVERLAY_MARKUP);
}

function applyDisplayTheme(theme) {
  if (theme) {
    document.body.dataset.displayTheme = theme;
  } else {
    delete document.body.dataset.displayTheme;
  }
}

function applySavedTheme(config = window.MLHDisplayConfig.loadDisplayConfig()) {
  ensureThemeOverlay();
  applyDisplayTheme(config.theme);
}

applySavedTheme();

window.addEventListener(window.MLHDisplayConfig.changeEvent, (event) => {
  applySavedTheme(event.detail);
});

window.addEventListener("storage", (event) => {
  if (event.key && event.key !== window.MLHDisplayConfig.storageKey) {
    return;
  }

  applySavedTheme();
});

window.MLHTheme = {
  applyDisplayTheme,
  applySavedTheme,
  ensureThemeOverlay,
};
