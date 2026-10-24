"use strict";

const searchInput = document.getElementById("search");
const viewToggle = document.getElementById("view-toggle");
const menuToggle = document.getElementById("menu-toggle");
const noResults = document.getElementById("no-results");
function filterNotes() {
  const query = searchInput.value.trim().toLocaleLowerCase("ru-RU");
  const cards = [...planContainer.querySelectorAll(".day")];
  let visible = 0;
  for (const card of cards) {
    card.hidden = !card.textContent.toLocaleLowerCase("ru-RU").includes(query);
    if (!card.hidden) visible += 1;
  }
  noResults.hidden = !query || cards.length === 0 || visible > 0;
}

searchInput.addEventListener("input", filterNotes);
new MutationObserver(filterNotes).observe(planContainer, { childList: true });

viewToggle.addEventListener("click", () => {
  const listView = planContainer.classList.toggle("list-view");
  viewToggle.setAttribute("aria-pressed", String(listView));
  viewToggle.setAttribute("aria-label", listView ? "Показать сеткой" : "Показать списком");
});

menuToggle.addEventListener("click", () => {
  const hidden = document.body.classList.toggle("sidebar-hidden");
  menuToggle.setAttribute("aria-expanded", String(!hidden));
  menuToggle.setAttribute("aria-label", hidden ? "Показать боковую панель" : "Скрыть боковую панель");
});

filterNotes();
