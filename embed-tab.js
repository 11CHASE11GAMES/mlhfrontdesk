const HOME_WINDOW_NAME = "mlh-frontdesk-home";
const closeLink = document.querySelector(".overlay-close");

if (closeLink) {
  closeLink.addEventListener("click", (event) => {
    event.preventDefault();

    const homeWindow = window.open("", HOME_WINDOW_NAME);

    if (homeWindow) {
      if (homeWindow.location.href === "about:blank") {
        homeWindow.location.replace(closeLink.href);
      }

      homeWindow.focus();
      return;
    }

    window.location.href = closeLink.href;
  });
}
