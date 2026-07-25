(function () {
  const KEY = "neeladri-theme";
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateIcon(theme) {
    if (btn) btn.textContent = theme === "dark" ? "☀" : "☾";
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    updateIcon(theme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }

  updateIcon(currentTheme());

  if (btn) {
    btn.addEventListener("click", () => {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }
})();