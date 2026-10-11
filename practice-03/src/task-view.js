import { getTaskStats } from "./task-service.js";

export function createTaskElement(task) {
  const li = document.createElement("li");
  li.classList.add("task-card");
  li.dataset.taskId = task.id;
  if (task.completed) {
    li.classList.add("is-completed");
  }

  // Заголовок (название)
  const h3 = document.createElement("h3");
  h3.classList.add("task-title");
  h3.textContent = task.title; // Безопасный вывод текста через textContent

  // Метаинформация (статус и приоритет)
  const metaDiv = document.createElement("div");
  metaDiv.classList.add("task-meta");

  const statusSpan = document.createElement("span");
  statusSpan.classList.add("task-status");
  statusSpan.textContent = task.completed ? "Выполнена" : "В работе";

  const prioritySpan = document.createElement("span");
  prioritySpan.classList.add("task-priority");
  const priorityMap = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };
  prioritySpan.textContent = priorityMap[task.priority] || task.priority;

  metaDiv.append(statusSpan, prioritySpan);

  // Действия (кнопки)
  const actionsDiv = document.createElement("div");
  actionsDiv.classList.add("task-actions");

  // Кнопка переключения статуса
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.dataset.action = "toggle";
  toggleBtn.setAttribute("aria-pressed", task.completed ? "true" : "false");
  
  const toggleLabel = document.createElement("span");
  toggleLabel.classList.add("action-label");
  toggleLabel.textContent = "Выполнена";
  toggleBtn.append(toggleLabel);

  // Кнопка удаления
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.dataset.action = "delete";

  const deleteLabel = document.createElement("span");
  deleteLabel.classList.add("action-label");
  deleteLabel.textContent = "Удалить";
  deleteBtn.append(deleteLabel);

  actionsDiv.append(toggleBtn, deleteBtn);

  li.append(h3, metaDiv, actionsDiv);
  return li;
}

export function renderTaskList(listElement, tasks) {
  const elements = tasks.map((task) => createTaskElement(task));
  listElement.replaceChildren(...elements);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  const stats = getTaskStats(tasks);

  const totalEl = summaryElement.querySelector('[data-stat="total"]');
  const completedEl = summaryElement.querySelector('[data-stat="completed"]');
  const pendingEl = summaryElement.querySelector('[data-stat="pending"]');
  const progressEl = summaryElement.querySelector('[data-stat="progress"]');
  const visibleEl = summaryElement.querySelector('[data-stat="visible"]');

  if (totalEl) totalEl.textContent = stats.total;
  if (completedEl) completedEl.textContent = stats.completed;
  if (pendingEl) pendingEl.textContent = stats.pending;
  if (progressEl) progressEl.textContent = `${stats.progress.toFixed(1)}%`;
  if (visibleEl) visibleEl.textContent = visibleCount;
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (total === 0 && visibleCount === 0) {
    messageElement.textContent = "Список задач пуст.";
    messageElement.hidden = false;
  } else if (total > 0 && visibleCount === 0) {
    messageElement.textContent = "Нет задач по выбранному фильтру.";
    messageElement.hidden = false;
  } else {
    messageElement.textContent = "";
    messageElement.hidden = true;
  }
}