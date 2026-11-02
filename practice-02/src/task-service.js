// Заготовка модуля. Реализация функций прикладной логики задач.

export function createTask(id, title, priority = "medium") {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "Некорректный id" };
  }
  if (typeof title !== "string" || title.trim() === "") {
    return { ok: false, error: "Некорректный заголовок" };
  }
  const validPriorities = ["low", "medium", "high"];
  if (!validPriorities.includes(priority)) {
    return { ok: false, error: "Некорректный приоритет" };
  }
  return {
    ok: true,
    task: { id, title: title.trim(), completed: false, priority }
  };
}

export function findTaskById(tasks, id) {
  if (!Array.isArray(tasks)) return undefined;
  return tasks.find(task => task.id === id);
}

export function getPendingTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter(task => task.completed === false);
}

export function getTaskTitles(tasks) {
  if (!Array.isArray(tasks)) return [];
  return tasks.map(task => task.title);
}

export function getTaskStats(tasks) {
  if (!Array.isArray(tasks)) {
    return { total: 0, completed: 0, pending: 0, progress: "0.0%" };
  }
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed === true).length;
  const pending = total - completed;
  const progressNum = total === 0 ? 0 : (completed / total) * 100;
  
  return {
    total,
    completed,
    pending,
    progress: progressNum.toFixed(1) + "%"
  };
}

export function addTask(tasks, id, title, priority = "medium") {
  if (!Array.isArray(tasks)) {
    return { ok: false, error: "Неверный формат массива задач" };
  }
  if (findTaskById(tasks, id)) {
    return { ok: false, error: "Задача с таким id уже существует" };
  }
  const creationResult = createTask(id, title, priority);
  if (!creationResult.ok) {
    return creationResult;
  }
  return {
    ok: true,
    tasks: [...tasks, creationResult.task]
  };
}

export function setTaskCompleted(tasks, id, completed) {
  if (!Array.isArray(tasks) || !Number.isSafeInteger(id) || id <= 0 || typeof completed !== "boolean") {
    return { ok: false, error: "Некорректные аргументы" };
  }
  const index = tasks.findIndex(task => task.id === id);
  if (index === -1) {
    return { ok: false, error: "Задача с указанным id не найдена" };
  }
  const newTasks = tasks.map((task, i) => 
    i === index ? { ...task, completed } : { ...task }
  );
  return { ok: true, tasks: newTasks };
}

export function renameTask(tasks, id, title) {
  if (!Array.isArray(tasks) || !Number.isSafeInteger(id) || id <= 0 || typeof title !== "string" || title.trim() === "") {
    return { ok: false, error: "Некорректные аргументы" };
  }
  const index = tasks.findIndex(task => task.id === id);
  if (index === -1) {
    return { ok: false, error: "Задача с указанным id не найдена" };
  }
  const newTasks = tasks.map((task, i) => 
    i === index ? { ...task, title: title.trim() } : { ...task }
  );
  return { ok: true, tasks: newTasks };
}

export function removeTask(tasks, id) {
  if (!Array.isArray(tasks) || !Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "Некорректный id" };
  }
  const index = tasks.findIndex(task => task.id === id);
  if (index === -1) {
    return { ok: false, error: "Задача с указанным id не найдена" };
  }
  const newTasks = tasks.filter(task => task.id !== id);
  return { ok: true, tasks: newTasks };
}