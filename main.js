const HOME_WINDOW_NAME = "mlh-frontdesk-home";
const links = document.querySelectorAll(".wheel-link");
const wheelCopy = document.querySelector(".wheel-copy");
const selectedTitle = document.querySelector("#selected-title");
const selectedDescription = document.querySelector("#selected-description");
const displayWindows = new Map();

window.name = HOME_WINDOW_NAME;

const defaultTitle = wheelCopy.dataset.defaultTitle;
const defaultDescription = wheelCopy.dataset.defaultDescription;

function getExistingDisplayWindow(windowName) {
  const currentDisplayWindow = displayWindows.get(windowName);

  if (currentDisplayWindow && !currentDisplayWindow.closed) {
    return currentDisplayWindow;
  }

  const namedWindow = window.open("", windowName);

  if (!namedWindow) {
    return null;
  }

  displayWindows.set(windowName, namedWindow);
  return namedWindow;
}

function setPreview(link) {
  selectedTitle.textContent = link.dataset.title;
  selectedDescription.textContent = link.dataset.description;
}

function resetPreview() {
  selectedTitle.textContent = defaultTitle;
  selectedDescription.textContent = defaultDescription;
}

links.forEach((link) => {
  link.addEventListener("mouseenter", () => setPreview(link));
  link.addEventListener("focus", () => setPreview(link));
  link.addEventListener("mouseleave", resetPreview);
  link.addEventListener("blur", resetPreview);

  link.addEventListener("click", (event) => {
    const windowName = link.dataset.windowName;

    if (!windowName) {
      return;
    }

    event.preventDefault();

    const destination =
      typeof link.href === "object" && "baseVal" in link.href
        ? link.href.baseVal
        : link.getAttribute("href");
    const currentDisplayWindow = getExistingDisplayWindow(windowName);

    if (!currentDisplayWindow) {
      return;
    }

    try {
      if (currentDisplayWindow.location.href === "about:blank") {
        currentDisplayWindow.location.replace(destination);
      }
    } catch {
      currentDisplayWindow.focus();
      return;
    }

    currentDisplayWindow.focus();
  });
});
