// src/task-service.js

function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  return { total, completed, pending, progress };
}

export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  if (typeof title !== "string" || title.trim() === "") {
    return { ok: false, error: "Название не может быть пустым" };
  }
  const normalizedTitle = title.trim();
  if (normalizedTitle.length > 100) {
    return { ok: false, error: "Название не должно превышать 100 символов" };
  }
  if (!["low", "medium", "high"].includes(priority)) {
    return { ok: false, error: "Приоритет должен быть low, medium или high" };
  }
  return { ok: true, task: { id, title: normalizedTitle, completed: false, priority } };
}

export function addTask(tasks, id, title, priority = "medium") {
  const createResult = createTask(id, title, priority);
  if (!createResult.ok) {
    return createResult;
  }
  if (findTaskById(tasks, id) !== undefined) {
    return { ok: false, error: `Задача с id ${id} уже существует` };
  }
  const nextTasks = [...tasks, createResult.task];
  return { ok: true, tasks: nextTasks };
}

export function setTaskCompleted(tasks, id, completed) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  if (typeof completed !== "boolean") {
    return { ok: false, error: "Признак выполнения должен быть true или false" };
  }
  const task = findTaskById(tasks, id);
  if (task === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }
  const nextTasks = tasks.map((item) => (item.id === id ? { ...item, completed } : item));
  return { ok: true, tasks: nextTasks };
}

export function renameTask(tasks, id, title) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  if (typeof title !== "string" || title.trim() === "") {
    return { ok: false, error: "Название не может быть пустым" };
  }
  const normalizedTitle = title.trim();
  if (normalizedTitle.length > 100) {
    return { ok: false, error: "Название не должно превышать 100 символов" };
  }
  const task = findTaskById(tasks, id);
  if (task === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }
  const nextTasks = tasks.map((item) => (item.id === id ? { ...item, title: normalizedTitle } : item));
  return { ok: true, tasks: nextTasks };
}

export function removeTask(tasks, id) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  const task = findTaskById(tasks, id);
  if (task === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }
  const nextTasks = tasks.filter((item) => item.id !== id);
  return { ok: true, tasks: nextTasks };
}

export function getVisibleTasks(tasks, filter = "all") {
  switch (filter) {
    case "pending":
      return tasks.filter((task) => !task.completed);
    case "completed":
      return tasks.filter((task) => task.completed);
    case "all":
    default:
      return [...tasks];
  }
}

export function updateTask(tasks, id, title, priority) {
  if (!isValidId(id)) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  if (typeof title !== "string" || title.trim() === "") {
    return { ok: false, error: "Название не может быть пустым" };
  }
  const normalizedTitle = title.trim();
  if (normalizedTitle.length > 100) {
    return { ok: false, error: "Название не должно превышать 100 символов" };
  }
  if (!["low", "medium", "high"].includes(priority)) {
    return { ok: false, error: "Приоритет должен быть low, medium или high" };
  }
  const task = findTaskById(tasks, id);
  if (task === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }
  const nextTasks = tasks.map((item) =>
    item.id === id ? { ...item, title: normalizedTitle, priority } : item // <-- ИСПРАВЛЕНО (просто item)
  );
  return { ok: true, tasks: nextTasks };
}