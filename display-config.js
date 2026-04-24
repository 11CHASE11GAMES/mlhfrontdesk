const DISPLAY_CONFIG_STORAGE_KEY = "mlh-display-config";
const DISPLAY_CONFIG_CHANGE_EVENT = "msoe-display-config-change";
const DISPLAY_CONFIG_CHANNEL_NAME = "msoe-display-config";
const VALID_DISPLAY_THEMES = Object.freeze(["summer", "winter", "autumn", "spring"]);
const VALID_DISPLAY_DORMS = Object.freeze(["MLH", "VT/MH", "GT"]);

const DEFAULT_DISPLAY_CONFIG = Object.freeze({
  packages:
    "https://apps.powerapps.com/play/e/ab0dc068-c9c9-e2a3-a913-cfb5fe4b3608/a/cff140ea-a67f-471e-936e-a2b9a3ec713d?tenantId=4046ceac-fdd3-46c9-ac80-b7c4a49bab70&hint=ae441aa3-5545-4f7c-a813-d61759adbfea&sourcetime=1769307128047&source=website&screenColor=rgba(9,9,9,1)",
  announcements:
    "https://docs.google.com/presentation/d/e/2PACX-1vQ6jwYwx2hBV6U0HCbGfam3IZKGcbs2J2VQmTK6nHi31DXp1L-fu1R8sf9CzvTgruwX0DuXyvSOdeRD/embed?start=true&loop=true&delayms=60000",
  events:
    "https://docs.google.com/presentation/d/e/2PACX-1vT1vdcpCdy2smHEGxhoRfPcPGf2Xm2Hx7PhiDlGM79UCg_cYt8jPWdFguyQk5qqzMFCwyWp0m5XgvUO/embed?start=true&loop=true&delayms=30000",
  slideshowAnnouncementsSeconds: 60,
  slideshowEventsSeconds: 30,
  rotationPackagesSeconds: 60,
  rotationAnnouncementsSeconds: 60,
  rotationEventsSeconds: 60,
  theme: "",
  autoTheme: false,
  dorm: "",
  showStatusWidget: true,
});

let displayConfigChannel = null;

if (typeof BroadcastChannel !== "undefined") {
  displayConfigChannel = new BroadcastChannel(DISPLAY_CONFIG_CHANNEL_NAME);
  displayConfigChannel.addEventListener("message", (event) => {
    const normalizedConfig = normalizeDisplayConfig(event.data);
    window.dispatchEvent(
      new CustomEvent(DISPLAY_CONFIG_CHANGE_EVENT, {
        detail: normalizedConfig,
      }),
    );
  });
}

function normalizeDisplayConfig(rawConfig = {}) {
  const normalizeRotationSeconds = (value, fallback) => {
    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isFinite(parsedValue)) {
      return fallback;
    }

    return parsedValue;
  };

  const normalizeSlideshowSeconds = (value, fallback) => {
    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isFinite(parsedValue)) {
      return fallback;
    }

    return parsedValue;
  };

  return {
    packages:
      typeof rawConfig.packages === "string" && rawConfig.packages.trim()
        ? rawConfig.packages.trim()
        : DEFAULT_DISPLAY_CONFIG.packages,
    announcements:
      typeof rawConfig.announcements === "string" && rawConfig.announcements.trim()
        ? rawConfig.announcements.trim()
        : DEFAULT_DISPLAY_CONFIG.announcements,
    events:
      typeof rawConfig.events === "string" && rawConfig.events.trim()
        ? rawConfig.events.trim()
        : DEFAULT_DISPLAY_CONFIG.events,
    slideshowAnnouncementsSeconds: normalizeSlideshowSeconds(
      rawConfig.slideshowAnnouncementsSeconds,
      DEFAULT_DISPLAY_CONFIG.slideshowAnnouncementsSeconds,
    ),
    slideshowEventsSeconds: normalizeSlideshowSeconds(
      rawConfig.slideshowEventsSeconds,
      DEFAULT_DISPLAY_CONFIG.slideshowEventsSeconds,
    ),
    rotationPackagesSeconds: normalizeRotationSeconds(
      rawConfig.rotationPackagesSeconds,
      DEFAULT_DISPLAY_CONFIG.rotationPackagesSeconds,
    ),
    rotationAnnouncementsSeconds: normalizeRotationSeconds(
      rawConfig.rotationAnnouncementsSeconds,
      DEFAULT_DISPLAY_CONFIG.rotationAnnouncementsSeconds,
    ),
    rotationEventsSeconds: normalizeRotationSeconds(
      rawConfig.rotationEventsSeconds,
      DEFAULT_DISPLAY_CONFIG.rotationEventsSeconds,
    ),
    theme:
      typeof rawConfig.theme === "string" &&
      VALID_DISPLAY_THEMES.includes(rawConfig.theme.trim().toLowerCase())
        ? rawConfig.theme.trim().toLowerCase()
        : DEFAULT_DISPLAY_CONFIG.theme,
    autoTheme:
      typeof rawConfig.autoTheme === "boolean"
        ? rawConfig.autoTheme
        : DEFAULT_DISPLAY_CONFIG.autoTheme,
    dorm:
      typeof rawConfig.dorm === "string" &&
      VALID_DISPLAY_DORMS.includes(rawConfig.dorm.trim().toUpperCase())
        ? rawConfig.dorm.trim().toUpperCase()
        : DEFAULT_DISPLAY_CONFIG.dorm,
    showStatusWidget:
      typeof rawConfig.showStatusWidget === "boolean"
        ? rawConfig.showStatusWidget
        : DEFAULT_DISPLAY_CONFIG.showStatusWidget,
  };
}

function loadDisplayConfig() {
  try {
    const rawValue = localStorage.getItem(DISPLAY_CONFIG_STORAGE_KEY);

    if (!rawValue) {
      return { ...DEFAULT_DISPLAY_CONFIG };
    }

    return normalizeDisplayConfig(JSON.parse(rawValue));
  } catch {
    return { ...DEFAULT_DISPLAY_CONFIG };
  }
}

function notifyDisplayConfigChange(nextConfig) {
  window.dispatchEvent(
    new CustomEvent(DISPLAY_CONFIG_CHANGE_EVENT, {
      detail: nextConfig,
    }),
  );

  if (displayConfigChannel) {
    displayConfigChannel.postMessage(nextConfig);
  }
}

function saveDisplayConfig(nextConfig) {
  const normalizedConfig = normalizeDisplayConfig(nextConfig);
  localStorage.setItem(DISPLAY_CONFIG_STORAGE_KEY, JSON.stringify(normalizedConfig));
  notifyDisplayConfigChange(normalizedConfig);
  return normalizedConfig;
}

function resetDisplayConfig() {
  localStorage.removeItem(DISPLAY_CONFIG_STORAGE_KEY);
  const defaultConfig = { ...DEFAULT_DISPLAY_CONFIG };
  notifyDisplayConfigChange(defaultConfig);
  return defaultConfig;
}

function getDisplayUrl(displayKey, config = loadDisplayConfig()) {
  const baseUrl = config?.[displayKey];

  if (typeof baseUrl !== "string" || !baseUrl) {
    return "";
  }

  if (displayKey !== "announcements" && displayKey !== "events") {
    return baseUrl;
  }

  try {
    const nextUrl = new URL(baseUrl);
    const slideshowSeconds =
      displayKey === "announcements"
        ? config.slideshowAnnouncementsSeconds
        : config.slideshowEventsSeconds;

    nextUrl.searchParams.set("start", "true");
    nextUrl.searchParams.set("loop", "true");
    nextUrl.searchParams.set("delayms", String(slideshowSeconds * 1000));

    return nextUrl.toString();
  } catch {
    return baseUrl;
  }
}

window.MLHDisplayConfig = {
  changeEvent: DISPLAY_CONFIG_CHANGE_EVENT,
  storageKey: DISPLAY_CONFIG_STORAGE_KEY,
  defaultConfig: DEFAULT_DISPLAY_CONFIG,
  validThemes: VALID_DISPLAY_THEMES,
  validDorms: VALID_DISPLAY_DORMS,
  getDisplayUrl,
  loadDisplayConfig,
  saveDisplayConfig,
  resetDisplayConfig,
};
