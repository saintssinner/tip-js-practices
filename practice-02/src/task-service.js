

export function createTask(id, title, priority = "medium") {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "id должен быть положительным безопасным целым числом" };
  }
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
    return { ok: false, error: "Длина названия должна быть от 1 до 100 символов" };
  }
  if (!["low", "medium", "high"].includes(priority)) {
    return { ok: false, error: "Недопустимый приоритет" };
  }

  return {
    ok: true,
    task: {
      id,
      title: trimmedTitle,
      completed: false,
      priority,
    },
  };
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
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  if (tasks.some((task) => task.id === id)) {
    return { ok: false, error: "Задача с таким id уже существует" };
  }
  const createResult = createTask(id, title, priority);
  if (!createResult.ok) {
    return createResult;
  }

  return {
    ok: true,
    tasks: [...tasks, createResult.task],
  };
}

export function setTaskCompleted(tasks, id, completed) {
  if (typeof completed !== "boolean") {
    return { ok: false, error: "Статус completed должен быть логическим значением" };
  }
  const targetTask = findTaskById(tasks, id);
  if (!targetTask) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, completed } : task
  );

  return {
    ok: true,
    tasks: updatedTasks,
  };
}

export function renameTask(tasks, id, title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
    return { ok: false, error: "Длина названия должна быть от 1 до 100 символов" };
  }
  const targetTask = findTaskById(tasks, id);
  if (!targetTask) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, title: trimmedTitle } : task
  );

  return {
    ok: true,
    tasks: updatedTasks,
  };
}

export function removeTask(tasks, id) {
  const targetTask = findTaskById(tasks, id);
  if (!targetTask) {
    return { ok: false, error: "Задача не найдена" };
  }

  const updatedTasks = tasks.filter((task) => task.id !== id);

  return {
    ok: true,
    tasks: updatedTasks,
  };
}