const HOME_WINDOW_NAME = "mlh-frontdesk-home";
const DISPLAY_KEYS = ["packages", "announcements", "events"];
const SLIDESHOW_FIELDS = Object.freeze([
  ["slideshowAnnouncementsSeconds", "Announcements"],
  ["slideshowEventsSeconds", "Events"],
]);
const ROTATION_FIELDS = Object.freeze([
  ["rotationPackagesSeconds", "Packages"],
  ["rotationAnnouncementsSeconds", "Announcements"],
  ["rotationEventsSeconds", "Events"],
]);
const THEME_PREVIEW_NAME = "settings-theme-preview";
const AUTO_THEME_FIELD_NAME = "autoTheme";
const DORM_FIELD_NAME = "dorm";
const STATUS_WIDGET_FIELD_NAME = "showStatusWidget";

window.name = HOME_WINDOW_NAME;

const settingsForm = document.querySelector("#display-settings-form");
const resetDefaultsButton = document.querySelector("#reset-defaults");
const removeThemePreviewButton = document.querySelector("#remove-theme-preview");
const settingsStatus = document.querySelector("#settings-status");
const settingsReminderToast = document.querySelector("#settings-reminder-toast");
const settingsReminderSaveButton = document.querySelector("#settings-reminder-save");
const themePicker = document.querySelector(".theme-picker");
const themePreviewInputs = Array.from(
  document.querySelectorAll(`[name="${THEME_PREVIEW_NAME}"]`),
);
let lastSavedConfig = null;

function getSettingsField(key) {
  return document.querySelector(`[name="${key}"]`);
}

function populateSettingsForm(config) {
  const autoThemeField = getSettingsField(AUTO_THEME_FIELD_NAME);
  const dormField = getSettingsField(DORM_FIELD_NAME);
  const statusWidgetField = getSettingsField(STATUS_WIDGET_FIELD_NAME);

  if (autoThemeField) {
    autoThemeField.checked = config.autoTheme;
    autoThemeField.removeAttribute("aria-invalid");
  }

  if (dormField) {
    dormField.value = config.dorm;
    dormField.removeAttribute("aria-invalid");
  }

  if (statusWidgetField) {
    statusWidgetField.checked = config.showStatusWidget;
    statusWidgetField.removeAttribute("aria-invalid");
  }

  DISPLAY_KEYS.forEach((key) => {
    const field = getSettingsField(key);

    if (field) {
      field.value = config[key];
      field.removeAttribute("aria-invalid");
    }
  });

  ROTATION_FIELDS.forEach(([fieldName]) => {
    const field = getSettingsField(fieldName);

    if (field) {
      field.value = config[fieldName];
      field.removeAttribute("aria-invalid");
    }
  });

  SLIDESHOW_FIELDS.forEach(([fieldName]) => {
    const field = getSettingsField(fieldName);

    if (field) {
      field.value = config[fieldName];
      field.removeAttribute("aria-invalid");
    }
  });
}

function getSelectedTheme() {
  return themePreviewInputs.find((input) => input.checked)?.value ?? "";
}

function isAutoThemeEnabled() {
  return Boolean(getSettingsField(AUTO_THEME_FIELD_NAME)?.checked);
}

function populateThemeSelection(theme) {
  themePreviewInputs.forEach((input) => {
    input.checked = input.value === theme;
  });

  applyThemePreview();
}

function setSettingsStatus(message, state = "neutral") {
  settingsStatus.textContent = message;
  settingsStatus.dataset.state = state;
}

function showSettingsReminder() {
  if (!settingsReminderToast) {
    return;
  }

  settingsReminderToast.classList.add("is-visible");
  settingsReminderToast.setAttribute("aria-hidden", "false");
}

function hideSettingsReminder() {
  if (!settingsReminderToast) {
    return;
  }

  settingsReminderToast.classList.remove("is-visible");
  settingsReminderToast.setAttribute("aria-hidden", "true");
}

function clearSettingsErrors() {
  const autoThemeField = getSettingsField(AUTO_THEME_FIELD_NAME);
  const dormField = getSettingsField(DORM_FIELD_NAME);
  const statusWidgetField = getSettingsField(STATUS_WIDGET_FIELD_NAME);

  if (autoThemeField) {
    autoThemeField.removeAttribute("aria-invalid");
  }

  if (dormField) {
    dormField.removeAttribute("aria-invalid");
  }

  if (statusWidgetField) {
    statusWidgetField.removeAttribute("aria-invalid");
  }

  DISPLAY_KEYS.forEach((key) => {
    const field = getSettingsField(key);

    if (field) {
      field.removeAttribute("aria-invalid");
    }
  });

  ROTATION_FIELDS.forEach(([fieldName]) => {
    const field = getSettingsField(fieldName);

    if (field) {
      field.removeAttribute("aria-invalid");
    }
  });

  SLIDESHOW_FIELDS.forEach(([fieldName]) => {
    const field = getSettingsField(fieldName);

    if (field) {
      field.removeAttribute("aria-invalid");
    }
  });
}

function getVisibleThemeSelection() {
  if (isAutoThemeEnabled()) {
    return window.MLHTheme?.getAutoThemeForDate() ?? "";
  }

  return getSelectedTheme();
}

function syncThemePreviewState() {
  const autoThemeEnabled = isAutoThemeEnabled();
  const visibleThemeSelection = getVisibleThemeSelection();

  themePreviewInputs.forEach((input) => {
    input.disabled = autoThemeEnabled;
    const option = input.closest(".theme-option");

    if (option) {
      option.classList.toggle("is-selected", input.value === visibleThemeSelection);
      option.classList.toggle("is-disabled", autoThemeEnabled);
    }
  });

  themePicker?.classList.toggle("is-disabled", autoThemeEnabled);

  if (removeThemePreviewButton) {
    removeThemePreviewButton.disabled = autoThemeEnabled;
  }
}

function applyThemePreview() {
  const theme = isAutoThemeEnabled()
    ? (window.MLHTheme?.getAutoThemeForDate() ?? "")
    : getSelectedTheme();

  if (theme) {
    document.body.dataset.displayTheme = theme;
  } else {
    delete document.body.dataset.displayTheme;
  }

  syncThemePreviewState();
}

function getDraftConfig() {
  const draftConfig = {
    autoTheme: isAutoThemeEnabled(),
    dorm: getSettingsField(DORM_FIELD_NAME)?.value.trim() ?? "",
    showStatusWidget: Boolean(getSettingsField(STATUS_WIDGET_FIELD_NAME)?.checked),
    theme: getSelectedTheme(),
  };

  DISPLAY_KEYS.forEach((key) => {
    draftConfig[key] = getSettingsField(key)?.value.trim() ?? "";
  });

  ROTATION_FIELDS.forEach(([fieldName]) => {
    draftConfig[fieldName] = Number.parseInt(getSettingsField(fieldName)?.value ?? "", 10) || 0;
  });

  SLIDESHOW_FIELDS.forEach(([fieldName]) => {
    draftConfig[fieldName] = Number.parseInt(getSettingsField(fieldName)?.value ?? "", 10) || 0;
  });

  return draftConfig;
}

function configsMatch(leftConfig, rightConfig) {
  if (!leftConfig || !rightConfig) {
    return false;
  }

  if (
    Boolean(leftConfig.autoTheme) !== Boolean(rightConfig.autoTheme) ||
    (leftConfig.dorm ?? "") !== (rightConfig.dorm ?? "") ||
    Boolean(leftConfig.showStatusWidget) !== Boolean(rightConfig.showStatusWidget) ||
    (leftConfig.theme ?? "") !== (rightConfig.theme ?? "")
  ) {
    return false;
  }

  if (!DISPLAY_KEYS.every((key) => (leftConfig[key] ?? "") === (rightConfig[key] ?? ""))) {
    return false;
  }

  if (
    !ROTATION_FIELDS.every(
      ([fieldName]) => Number(leftConfig[fieldName] ?? 0) === Number(rightConfig[fieldName] ?? 0),
    )
  ) {
    return false;
  }

  return SLIDESHOW_FIELDS.every(
    ([fieldName]) => Number(leftConfig[fieldName] ?? 0) === Number(rightConfig[fieldName] ?? 0),
  );
}

function syncSettingsReminder() {
  if (configsMatch(getDraftConfig(), lastSavedConfig)) {
    hideSettingsReminder();
    return;
  }

  showSettingsReminder();
}

function validateSettingsForm() {
  const nextConfig = {};
  const dormField = getSettingsField(DORM_FIELD_NAME);
  const dormValue = dormField?.value.trim() ?? "";

  if (dormValue && !window.MLHDisplayConfig.validDorms.includes(dormValue)) {
    dormField?.setAttribute("aria-invalid", "true");
    dormField?.focus();
    return {
      valid: false,
      message: "Choose one of the available dorm names.",
    };
  }

  nextConfig.autoTheme = isAutoThemeEnabled();
  nextConfig.dorm = dormValue;
  nextConfig.showStatusWidget = Boolean(getSettingsField(STATUS_WIDGET_FIELD_NAME)?.checked);

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

  for (const [fieldName, fieldLabel] of ROTATION_FIELDS) {
    const field = getSettingsField(fieldName);
    const parsedValue = Number.parseInt(field?.value ?? "", 10);

    if (!Number.isFinite(parsedValue)) {
      field?.setAttribute("aria-invalid", "true");
      field?.focus();
      return {
        valid: false,
        message: `${fieldLabel} rotation must be a number.`,
      };
    }

    nextConfig[fieldName] = parsedValue;
    field?.removeAttribute("aria-invalid");
  }

  for (const [fieldName, fieldLabel] of SLIDESHOW_FIELDS) {
    const field = getSettingsField(fieldName);
    const parsedValue = Number.parseInt(field?.value ?? "", 10);

    if (!Number.isFinite(parsedValue)) {
      field?.setAttribute("aria-invalid", "true");
      field?.focus();
      return {
        valid: false,
        message: `${fieldLabel} slide delay must be a number.`,
      };
    }

    nextConfig[fieldName] = parsedValue;
    field?.removeAttribute("aria-invalid");
  }

  nextConfig.theme = getSelectedTheme();

  return {
    valid: true,
    config: nextConfig,
  };
}

const initialConfig = window.MLHDisplayConfig.loadDisplayConfig();
lastSavedConfig = { ...initialConfig };
populateSettingsForm(initialConfig);
populateThemeSelection(initialConfig.theme);
window.MLHDormBranding?.applySavedBranding(initialConfig);
hideSettingsReminder();

themePreviewInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (isAutoThemeEnabled()) {
      return;
    }

    applyThemePreview();
    syncSettingsReminder();
  });

  const option = input.closest(".theme-option");

  if (option) {
    option.addEventListener("click", () => {
      if (isAutoThemeEnabled()) {
        return;
      }

      input.checked = true;
      applyThemePreview();
      syncSettingsReminder();
    });
  }
});

removeThemePreviewButton?.addEventListener("click", () => {
  if (isAutoThemeEnabled()) {
    return;
  }

  populateThemeSelection("");
  syncSettingsReminder();
});

settingsReminderSaveButton?.addEventListener("click", () => {
  settingsForm?.requestSubmit();
});

getSettingsField(AUTO_THEME_FIELD_NAME)?.addEventListener("change", () => {
  applyThemePreview();
  syncSettingsReminder();
});

getSettingsField(DORM_FIELD_NAME)?.addEventListener("change", (event) => {
  const nextDorm = event.target.value.trim();
  const currentConfig = window.MLHDisplayConfig.loadDisplayConfig();

  window.MLHDormBranding?.applySavedBranding({
    ...currentConfig,
    dorm: nextDorm,
  });
  syncSettingsReminder();
});

getSettingsField(STATUS_WIDGET_FIELD_NAME)?.addEventListener("change", (event) => {
  const currentConfig = window.MLHDisplayConfig.loadDisplayConfig();

  window.MLHStatusWidget?.applySavedStatusWidget({
    ...currentConfig,
    showStatusWidget: Boolean(event.target.checked),
  });
  syncSettingsReminder();
});

DISPLAY_KEYS.forEach((key) => {
  const field = getSettingsField(key);

  field?.addEventListener("input", syncSettingsReminder);
  field?.addEventListener("change", syncSettingsReminder);
});

ROTATION_FIELDS.forEach(([fieldName]) => {
  const field = getSettingsField(fieldName);

  field?.addEventListener("input", syncSettingsReminder);
  field?.addEventListener("change", syncSettingsReminder);
});

SLIDESHOW_FIELDS.forEach(([fieldName]) => {
  const field = getSettingsField(fieldName);

  field?.addEventListener("input", syncSettingsReminder);
  field?.addEventListener("change", syncSettingsReminder);
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
  lastSavedConfig = { ...savedConfig };
  populateSettingsForm(savedConfig);
  populateThemeSelection(savedConfig.theme);
  window.MLHDormBranding?.applySavedBranding(savedConfig);
  window.MLHStatusWidget?.applySavedStatusWidget(savedConfig);
  hideSettingsReminder();
  setSettingsStatus(
    "Saved. Open tabs will update to the dorm name, status panel, links, slideshow timing, rotation timing, and theme settings.",
    "success",
  );
});

resetDefaultsButton.addEventListener("click", () => {
  clearSettingsErrors();
  const defaultConfig = window.MLHDisplayConfig.resetDisplayConfig();
  lastSavedConfig = { ...defaultConfig };
  populateSettingsForm(defaultConfig);
  populateThemeSelection(defaultConfig.theme);
  window.MLHDormBranding?.applySavedBranding(defaultConfig);
  window.MLHStatusWidget?.applySavedStatusWidget(defaultConfig);
  hideSettingsReminder();
  setSettingsStatus("Defaults restored. Open tabs will update.", "success");
});
