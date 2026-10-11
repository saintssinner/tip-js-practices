import { demoTasks, variantNumber, variantTasks } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";

// Проверка параметра dataset=variant в URL для индивидуального варианта
const params = new URLSearchParams(window.location.search);
const useVariant = params.get("dataset") === "variant";

let currentTasks = useVariant ? [...variantTasks] : [...demoTasks];
let currentFilter = "all";

// Элементы DOM
const taskListEl = document.querySelector("#task-list");
const taskSummaryEl = document.querySelector("#task-summary");
const emptyMessageEl = document.querySelector("#empty-message");
const operationMessageEl = document.querySelector("#operation-message");
const filterButtons = document.querySelectorAll(".filter-btn");

function renderApp() {
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);

  renderTaskList(taskListEl, visibleTasks);
  renderSummary(taskSummaryEl, currentTasks, visibleTasks.length);
  renderEmptyState(emptyMessageEl, currentTasks.length, visibleTasks.length);

  // Обновление активного состояния кнопок фильтров
  filterButtons.forEach((btn) => {
    const filter = btn.dataset.filter;
    const isActive = filter === currentFilter;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function restoreTaskFocus(id, action) {
  const card = taskListEl.querySelector(`li[data-task-id="${id}"]`);
  if (card) {
    const selector = action === "toggle" ? 'button[data-action="toggle"]' : 'button[data-action="delete"]';
    const btn = card.querySelector(selector);
    if (btn) {
      btn.focus();
      return;
    }
  }
  const activeFilterBtn = document.querySelector(`.filter-btn[data-filter="${currentFilter}"]`);
  if (activeFilterBtn) {
    activeFilterBtn.focus();
  }
}

function handleTaskListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button || !taskListEl.contains(button)) return;

  const card = button.closest("li[data-task-id]");
  if (!card) return;

  const rawId = card.dataset.taskId;
  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    operationMessageEl.textContent = "Ошибка: некорректный идентификатор задачи.";
    return;
  }

  const action = button.dataset.action;
  const task = findTaskById(currentTasks, id);

  if (!task) {
    operationMessageEl.textContent = "Ошибка: задача не найдена в списке.";
    return;
  }

  let result;
  if (action === "toggle") {
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else if (action === "delete") {
    result = removeTask(currentTasks, id);
  }

  if (result && result.ok) {
    currentTasks = result.tasks;
    operationMessageEl.textContent = "";
    renderApp();
    restoreTaskFocus(id, action);
  } else if (result) {
    operationMessageEl.textContent = `Ошибка: ${result.error}`;
  }
}

function handleFilterClick(event) {
  const button = event.target.closest(".filter-btn");
  if (!button) return;

  const filter = button.dataset.filter;
  if (!["all", "pending", "completed"].includes(filter)) return;

  currentFilter = filter;
  operationMessageEl.textContent = "";
  renderApp();
  button.focus();
}

// Инициализация подписок
taskListEl.addEventListener("click", handleTaskListClick);
document.querySelector("#task-filters").addEventListener("click", handleFilterClick);

// Первичная отрисовка
renderApp();