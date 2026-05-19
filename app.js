const appState = {
  toastTimer: null
};

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(appState.toastTimer);
  appState.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

document.addEventListener("click", (event) => {
  const checkButton = event.target.closest("[data-toggle-done]");
  if (checkButton) {
    checkButton.closest(".list-row")?.classList.toggle("is-done");
    return;
  }

  const dot = event.target.closest("[data-habit-dot]");
  if (dot) {
    dot.classList.toggle("is-on");
    return;
  }

  const segment = event.target.closest("[data-segment]");
  if (segment) {
    const group = segment.closest("[data-segment-group]");
    group?.querySelectorAll("[data-segment]").forEach((button) => button.classList.remove("is-active"));
    segment.classList.add("is-active");
    const target = segment.dataset.segment;
    document.querySelectorAll("[data-view]").forEach((view) => {
      view.hidden = view.dataset.view !== target;
    });
    return;
  }

  const toggle = event.target.closest("[data-toggle]");
  if (toggle) {
    toggle.classList.toggle("is-on");
    toggle.setAttribute("aria-pressed", toggle.classList.contains("is-on") ? "true" : "false");
    return;
  }

  const action = event.target.closest("[data-action]");
  if (action) {
    showToast(action.dataset.action);
  }
});

document.addEventListener("submit", (event) => {
  const todoForm = event.target.closest("[data-todo-form]");
  if (!todoForm) return;
  event.preventDefault();
  const input = todoForm.querySelector("input");
  const text = input.value.trim();
  if (!text) return;
  const list = document.querySelector("[data-todo-list]");
  const row = document.createElement("div");
  row.className = "list-row";
  row.innerHTML = `<button class="check" type="button" aria-label="Mark complete" data-toggle-done></button><div><strong></strong><span>Added just now</span></div><span>Today</span>`;
  row.querySelector("strong").textContent = text;
  list?.prepend(row);
  input.value = "";
  showToast("Reminder added");
});
