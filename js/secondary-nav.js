(() => {
  const button = document.querySelector(".seo-menu-toggle");
  const nav = document.getElementById("mobile-navigation");
  if (!button || !nav) return;

  const close = () => {
    nav.hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation");
  };

  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    if (open) {
      close();
    } else {
      nav.hidden = false;
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "Close navigation");
    }
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) close();
  });
})();
