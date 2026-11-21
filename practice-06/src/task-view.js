const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});
export function createTaskElement(task, category) {
  const node = document.createElement("li");
  node.className = `task-card${task.completed ? " is-completed" : ""}`;
  node.dataset.taskId = String(task.id);

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;
  node.append(title);

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Выполнено" : "В работе";
  meta.append(status);

  const priority = document.createElement("span");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;
  meta.append(priority);

  const categoryName = document.createElement("span");
  categoryName.className = "task-category";
  categoryName.textContent = category?.name ?? "—";
  meta.append(categoryName);

  node.append(meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.dataset.action = "toggle";
  const toggleLabel = document.createElement("span");
  toggleLabel.className = "action-label";
  toggleLabel.textContent = task.completed ? "Вернуть в работу" : "Завершить";
  toggle.append(toggleLabel);
  actions.append(toggle);

  const edit = document.createElement("button");
  edit.type = "button";
  edit.dataset.action = "edit";
  const editLabel = document.createElement("span");
  editLabel.className = "action-label";
  editLabel.textContent = "Изменить";
  edit.append(editLabel);
  actions.append(edit);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.dataset.action = "delete";
  const removeLabel = document.createElement("span");
  removeLabel.className = "action-label";
  removeLabel.textContent = "Удалить";
  remove.append(removeLabel);
  actions.append(remove);

  node.append(actions);
  return node;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map(
    (Array.isArray(categories) ? categories : [])
      .filter((category) => category && Number.isSafeInteger(category.id))
      .map((category) => [category.id, category]),
  );
  const elements = (Array.isArray(tasks) ? tasks : []).map((task) =>
    createTaskElement(task, byId.get(task.categoryId)),
  );
  list.replaceChildren(...elements);
}
