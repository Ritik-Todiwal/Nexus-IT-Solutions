/* Load shared layout components before page interactions initialize. */
(async function loadSharedComponents() {
  const currentNavbar = document.querySelector("nav.navbar, #navbar");
  const currentFooter = document.querySelector("footer.footer, #footer");

  if (currentNavbar) currentNavbar.remove();
  if (currentFooter) currentFooter.remove();

  const componentTargets = [
    ["navbar", "components/navbar.html", "afterbegin"],
    ["footer", "components/footer.html", "beforeend"]
  ];

  try {
    await Promise.all(componentTargets.map(async ([id, path, position]) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Could not load ${path}`);
      const wrapper = document.createElement("div");
      wrapper.id = id;
      wrapper.innerHTML = await response.text();
      document.body.insertAdjacentElement(position, wrapper);
    }));

    const mainScript = document.createElement("script");
    mainScript.src = "js/main.js";
    document.body.appendChild(mainScript);
  } catch (error) {
    console.error("Could not load shared page components.", error);
  }
})();
