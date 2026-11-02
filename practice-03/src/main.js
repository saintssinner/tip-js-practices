import { demoTasks, variantTasks, variantNumber } from "./data.js";
import {
  getVisibleTasks,
  setTaskCompleted,
  removeTask,
  findTaskById,
} from "./task-service.js";
import {
  renderTaskList,
  renderSummary,
  renderEmptyState,
} from "./task-view.js";


const elements = {
  list: document.querySelector("#task-list"),
  summary: document.querySelector("#task-summary"),
  emptyMessage: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  filters: document.querySelector("#task-filters"),
  datasetLabel: document.querySelector("#dataset-label"),
};


const params = new URLSearchParams(window.location.search);
const isVariant = params.get("dataset") === "variant";

let currentTasks = isVariant ? [...variantTasks] : [...demoTasks];
let currentFilter = "all";


function renderApp() {
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);
  renderTaskList(elements.list, visibleTasks);
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  renderEmptyState(elements.emptyMessage, currentTasks.length, visibleTasks.length);
}


function restoreTaskFocus(id, action) {

  const sameButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`
  );
  if (sameButton) {
    sameButton.focus();
    return;
  }
  const firstButton = elements.list.querySelector("button[data-action]");
  if (firstButton) {
    firstButton.focus();
    return;
  }

  const activeFilter =
    elements.filters.querySelector("button.is-active") ||
    elements.filters.querySelector("button");
  if (activeFilter) {
    activeFilter.focus();
  }
}

function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;

  const filterButton = event.target.closest("button[data-filter]");
  if (!filterButton || !elements.filters.contains(filterButton)) return;

  const newFilter = filterButton.dataset.filter;
  if (!["all", "pending", "completed"].includes(newFilter)) return;

  currentFilter = newFilter;

  elements.filters.querySelectorAll("button[data-filter]").forEach((btn) => {
    const isActive = btn.dataset.filter === newFilter;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  renderApp();
}

function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-action]");
  if (!button || !elements.list.contains(button)) return;

  const action = button.dataset.action;
  if (action !== "toggle" && action !== "delete") return;

  const card = button.closest("[data-task-id]");
  if (!card || !elements.list.contains(card)) return;

  const id = Number(card.dataset.taskId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    elements.message.textContent = "Ошибка: некорректный идентификатор задачи";
    return;
  }

  let result;
  if (action === "toggle") {
    const task = findTaskById(currentTasks, id);
    if (task === undefined) {
      elements.message.textContent = `Ошибка: задача с id ${id} не найдена`;
      return;
    }
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else {
    result = removeTask(currentTasks, id);
  }

  if (!result.ok) {
    elements.message.textContent = `Ошибка: ${result.error}`;
    return;
  }

  currentTasks = result.tasks;
  elements.message.textContent = "";
  renderApp();
  restoreTaskFocus(id, action);
}

elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант ${variantNumber}`
  : "Общий набор";

renderApp();