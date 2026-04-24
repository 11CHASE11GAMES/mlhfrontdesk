const STATUS_WIDGET_SELECTOR = ".status-widget";
const STATUS_WIDGET_CACHE_KEY = "msoe-milwaukee-weather-cache";
const STATUS_WIDGET_REFRESH_MS = 10 * 60 * 1000;
const STATUS_WIDGET_TIMEZONE = "America/Chicago";
const MILWAUKEE_LATITUDE = 43.0389;
const MILWAUKEE_LONGITUDE = -87.9065;
const WEATHER_ENDPOINT =
  `https://api.open-meteo.com/v1/forecast?latitude=${MILWAUKEE_LATITUDE}` +
  `&longitude=${MILWAUKEE_LONGITUDE}` +
  "&current=temperature_2m,weather_code,is_day" +
  "&temperature_unit=fahrenheit" +
  `&timezone=${encodeURIComponent(STATUS_WIDGET_TIMEZONE)}`;

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STATUS_WIDGET_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STATUS_WIDGET_TIMEZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

let statusWidgetRoot = null;
let statusWidgetTime = null;
let statusWidgetDate = null;
let statusWidgetWeatherIcon = null;
let statusWidgetWeatherLabel = null;
let statusWidgetTemperature = null;

function ensureStatusWidget() {
  if (statusWidgetRoot) {
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <aside class="status-widget" aria-live="polite">
        <p class="status-widget-time"></p>
        <p class="status-widget-date"></p>
        <div class="status-widget-weather-row">
          <span class="status-widget-weather-icon" aria-hidden="true"></span>
          <div class="status-widget-weather-copy">
            <p class="status-widget-weather-label">Milwaukee weather loading...</p>
            <p class="status-widget-temperature"></p>
          </div>
        </div>
      </aside>
    `,
  );

  statusWidgetRoot = document.querySelector(STATUS_WIDGET_SELECTOR);
  statusWidgetTime = statusWidgetRoot?.querySelector(".status-widget-time") ?? null;
  statusWidgetDate = statusWidgetRoot?.querySelector(".status-widget-date") ?? null;
  statusWidgetWeatherIcon =
    statusWidgetRoot?.querySelector(".status-widget-weather-icon") ?? null;
  statusWidgetWeatherLabel =
    statusWidgetRoot?.querySelector(".status-widget-weather-label") ?? null;
  statusWidgetTemperature =
    statusWidgetRoot?.querySelector(".status-widget-temperature") ?? null;
}

function updateStatusDateTime() {
  ensureStatusWidget();

  if (statusWidgetTime) {
    statusWidgetTime.textContent = timeFormatter.format(new Date());
  }

  if (statusWidgetDate) {
    statusWidgetDate.textContent = `Milwaukee | ${dateFormatter.format(new Date())}`;
  }
}

function getWeatherCondition(weatherCode, isDay = 1) {
  const daylight = Number(isDay) === 1;

  if (weatherCode === 0) {
    return {
      icon: daylight ? "\u2600\uFE0F" : "\uD83C\uDF19",
      label: daylight ? "Clear" : "Clear Night",
    };
  }

  if (weatherCode === 1 || weatherCode === 2) {
    return {
      icon: daylight ? "\u26C5" : "\u2601\uFE0F",
      label: daylight ? "Partly Cloudy" : "Cloudy Night",
    };
  }

  if (weatherCode === 3) {
    return {
      icon: "\u2601\uFE0F",
      label: "Cloudy",
    };
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return {
      icon: "\uD83C\uDF2B\uFE0F",
      label: "Fog",
    };
  }

  if ([51, 53, 55, 56, 57].includes(weatherCode)) {
    return {
      icon: "\uD83C\uDF27\uFE0F",
      label: "Drizzle",
    };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return {
      icon: "\uD83C\uDF27\uFE0F",
      label: "Rain",
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return {
      icon: "\u2744\uFE0F",
      label: "Snow",
    };
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return {
      icon: "\u26C8\uFE0F",
      label: "Storm",
    };
  }

  return {
    icon: "\u2601\uFE0F",
    label: "Weather",
  };
}

function renderWeatherStatus(weather) {
  ensureStatusWidget();

  if (!statusWidgetWeatherIcon || !statusWidgetWeatherLabel || !statusWidgetTemperature) {
    return;
  }

  const hasTemperature = typeof weather?.temperature === "number";
  const condition = getWeatherCondition(weather?.weatherCode, weather?.isDay);

  statusWidgetWeatherIcon.textContent = condition.icon;
  statusWidgetWeatherLabel.textContent = hasTemperature
    ? condition.label
    : "Weather unavailable";
  statusWidgetTemperature.textContent = hasTemperature
    ? `${Math.round(weather.temperature)}\u00B0F`
    : "Milwaukee forecast unavailable";
}

function applyStatusWidgetScale(config = window.MLHDisplayConfig.loadDisplayConfig()) {
  ensureStatusWidget();

  if (!statusWidgetRoot) {
    return;
  }

  const scalePercent = Number(config.statusWidgetScalePercent);
  const normalizedScale = Number.isFinite(scalePercent) ? scalePercent / 100 : 1;

  statusWidgetRoot.style.setProperty("--status-widget-scale", String(normalizedScale));
}

function getCachedWeather() {
  try {
    const rawValue = localStorage.getItem(STATUS_WIDGET_CACHE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (
      typeof parsedValue?.temperature !== "number" ||
      typeof parsedValue?.timestamp !== "number"
    ) {
      return null;
    }

    return {
      temperature: parsedValue.temperature,
      weatherCode:
        typeof parsedValue.weatherCode === "number" ? parsedValue.weatherCode : null,
      isDay: typeof parsedValue.isDay === "number" ? parsedValue.isDay : 1,
      timestamp: parsedValue.timestamp,
    };
  } catch {
    return null;
  }
}

function cacheWeather(temperature, weatherCode, isDay) {
  localStorage.setItem(
    STATUS_WIDGET_CACHE_KEY,
    JSON.stringify({
      temperature,
      weatherCode,
      isDay,
      timestamp: Date.now(),
    }),
  );
}

async function refreshMilwaukeeWeather(force = false) {
  const currentConfig = window.MLHDisplayConfig.loadDisplayConfig();

  if (!currentConfig.showStatusWidget) {
    return;
  }

  const cachedWeather = getCachedWeather();

  if (cachedWeather) {
    renderWeatherStatus(cachedWeather);

    if (!force && Date.now() - cachedWeather.timestamp < STATUS_WIDGET_REFRESH_MS) {
      return;
    }
  }

  try {
    const response = await fetch(WEATHER_ENDPOINT, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Weather request failed");
    }

    const payload = await response.json();
    const nextTemperature = payload?.current?.temperature_2m;
    const nextWeatherCode = payload?.current?.weather_code;
    const nextIsDay = payload?.current?.is_day;

    if (
      typeof nextTemperature !== "number" ||
      typeof nextWeatherCode !== "number" ||
      typeof nextIsDay !== "number"
    ) {
      throw new Error("Weather payload missing current conditions");
    }

    const nextWeather = {
      temperature: nextTemperature,
      weatherCode: nextWeatherCode,
      isDay: nextIsDay,
      timestamp: Date.now(),
    };

    cacheWeather(nextTemperature, nextWeatherCode, nextIsDay);
    renderWeatherStatus(nextWeather);
  } catch {
    if (cachedWeather) {
      renderWeatherStatus(cachedWeather);
      return;
    }

    renderWeatherStatus(null);
  }
}

function applyStatusWidgetVisibility(config = window.MLHDisplayConfig.loadDisplayConfig()) {
  ensureStatusWidget();

  if (!statusWidgetRoot) {
    return;
  }

  applyStatusWidgetScale(config);
  statusWidgetRoot.hidden = !config.showStatusWidget;

  if (config.showStatusWidget) {
    updateStatusDateTime();
    void refreshMilwaukeeWeather();
  }
}

ensureStatusWidget();
updateStatusDateTime();
applyStatusWidgetVisibility();
void refreshMilwaukeeWeather();

window.setInterval(updateStatusDateTime, 15000);
window.setInterval(() => {
  void refreshMilwaukeeWeather(true);
}, STATUS_WIDGET_REFRESH_MS);

window.addEventListener(window.MLHDisplayConfig.changeEvent, (event) => {
  applyStatusWidgetVisibility(event.detail);
});

window.addEventListener("storage", (event) => {
  if (event.key === STATUS_WIDGET_CACHE_KEY) {
    renderWeatherStatus(getCachedWeather());
    return;
  }

  if (event.key && event.key !== window.MLHDisplayConfig.storageKey) {
    return;
  }

  applyStatusWidgetVisibility();
});

window.MLHStatusWidget = {
  applySavedStatusWidget: applyStatusWidgetVisibility,
  applyStatusWidgetVisibility,
  refreshMilwaukeeWeather,
  updateStatusDateTime,
  updateStatusTime: updateStatusDateTime,
};
