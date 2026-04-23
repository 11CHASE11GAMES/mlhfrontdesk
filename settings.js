const HOME_WINDOW_NAME = "mlh-frontdesk-home";
const DISPLAY_KEYS = ["packages", "announcements", "events"];
const THEME_PREVIEW_NAME = "settings-theme-preview";

window.name = HOME_WINDOW_NAME;

const settingsForm = document.querySelector("#display-settings-form");
const resetDefaultsButton = document.querySelector("#reset-defaults");
const removeThemePreviewButton = document.querySelector("#remove-theme-preview");
const settingsStatus = document.querySelector("#settings-status");
const themePreviewInputs = Array.from(
  document.querySelectorAll(`[name="${THEME_PREVIEW_NAME}"]`),
);

function getSettingsField(key) {
  return document.querySelector(`[name="${key}"]`);
}

function populateSettingsForm(config) {
  DISPLAY_KEYS.forEach((key) => {
    const field = getSettingsField(key);

    if (field) {
      field.value = config[key];
      field.removeAttribute("aria-invalid");
    }
  });
}

function getSelectedTheme() {
  return themePreviewInputs.find((input) => input.checked)?.value ?? "";
}

function populateThemeSelection(theme) {
  themePreviewInputs.forEach((input) => {
    input.checked = input.value === theme;
  });

  applyThemePreview(theme);
}

function setSettingsStatus(message, state = "neutral") {
  settingsStatus.textContent = message;
  settingsStatus.dataset.state = state;
}

function clearSettingsErrors() {
  DISPLAY_KEYS.forEach((key) => {
    const field = getSettingsField(key);

    if (field) {
      field.removeAttribute("aria-invalid");
    }
  });
}

function syncThemePreviewState() {
  themePreviewInputs.forEach((input) => {
    const option = input.closest(".theme-option");

    if (option) {
      option.classList.toggle("is-selected", input.checked);
    }
  });
}

function applyThemePreview(theme) {
  if (theme) {
    document.body.dataset.displayTheme = theme;
  } else {
    delete document.body.dataset.displayTheme;
  }

  syncThemePreviewState();
}

function validateSettingsForm() {
  const nextConfig = {};

  for (const key of DISPLAY_KEYS) {
    const field = getSettingsField(key);
    const value = field.value.trim();

    if (!value) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
      return {
        valid: false,
        message: "Each display needs a URL before it can be saved.",
      };
    }

    try {
      const parsedUrl = new URL(value);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }

      nextConfig[key] = parsedUrl.toString();
      field.removeAttribute("aria-invalid");
    } catch {
      field.setAttribute("aria-invalid", "true");
      field.focus();
      return {
        valid: false,
        message: "Use a full http or https URL for each display link.",
      };
    }
  }

  nextConfig.theme = getSelectedTheme();

  return {
    valid: true,
    config: nextConfig,
  };
}

const initialConfig = window.MLHDisplayConfig.loadDisplayConfig();
populateSettingsForm(initialConfig);
populateThemeSelection(initialConfig.theme);

themePreviewInputs.forEach((input) => {
  input.addEventListener("change", () => {
    applyThemePreview(input.value);
  });

  const option = input.closest(".theme-option");

  if (option) {
    option.addEventListener("click", () => {
      input.checked = true;
      applyThemePreview(input.value);
    });
  }
});

removeThemePreviewButton?.addEventListener("click", () => {
  populateThemeSelection("");
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearSettingsErrors();

  const validationResult = validateSettingsForm();

  if (!validationResult.valid) {
    setSettingsStatus(validationResult.message, "error");
    return;
  }

  const savedConfig = window.MLHDisplayConfig.saveDisplayConfig(validationResult.config);
  populateSettingsForm(savedConfig);
  populateThemeSelection(savedConfig.theme);
  setSettingsStatus(
    "Saved. Open tabs will update to the new links and theme.",
    "success",
  );
});

resetDefaultsButton.addEventListener("click", () => {
  clearSettingsErrors();
  const defaultConfig = window.MLHDisplayConfig.resetDisplayConfig();
  populateSettingsForm(defaultConfig);
  populateThemeSelection(defaultConfig.theme);
  setSettingsStatus("Defaults restored. Open tabs will update.", "success");
});
