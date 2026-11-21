import { ApiError } from "./api-client.js";
const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);
function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}
function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}
export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}
export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}
function validateId(id, action) {
  if (!isPositiveSafeInteger(id)) {
    throw new TypeError(`id должен быть положительным целым числом (${action}).`);
  }
}
function normalizeFilters(filters) {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("Фильтры должны быть объектом.");
  }
  for (const key of Object.keys(filters)) {
    if (!ALLOWED_FILTERS.has(key)) {
      throw new TypeError(`Неизвестный фильтр: ${key}.`);
    }
  }
  const normalized = {};
  if ("completed" in filters) {
    if (typeof filters.completed !== "boolean") {
      throw new TypeError("completed должен быть логическим значением.");
    }
    normalized.completed = filters.completed;
  }
  if ("priority" in filters) {
    if (!ALLOWED_PRIORITIES.has(filters.priority)) {
      throw new TypeError("priority должен быть low, medium или high.");
    }
    normalized.priority = filters.priority;
  }
  if ("categoryId" in filters) {
    if (!isPositiveSafeInteger(filters.categoryId)) {
      throw new TypeError("categoryId должен быть положительным целым числом.");
    }
    normalized.categoryId = filters.categoryId;
  }
  if ("q" in filters) {
    if (typeof filters.q !== "string") {
      throw new TypeError("q должен быть строкой.");
    }
    const q = filters.q.trim();
    if (q.length > 100) {
      throw new TypeError("q не должен быть длиннее 100 символов.");
    }
    if (q) normalized.q = q;
  }
  return normalized;
}
function validateMeta(meta, tasks, context) {
  if (meta === undefined || meta === null) {
    return { total: tasks.length };
  }
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    throw invalidResponse(`meta имеет неверную форму (${context}).`);
  }
  if (!Number.isSafeInteger(meta.total) || meta.total < 0) {
    throw invalidResponse(`meta.total имеет неверную форму (${context}).`);
  }
  const result = { total: meta.total };
  if (meta.filters !== undefined) result.filters = meta.filters;
  return result;
}
// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных — { signal }.
export function createTaskApi(client) {
  if (!client || typeof client !== "object" || typeof client.requestJson !== "function") {
    throw new TypeError("createTaskApi ожидает объект с requestJson.");
  }

  async function getTasks(filters = {}, options = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", {
      query,
      signal: options.signal,
    });
    if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
      throw invalidResponse("Ответ со списком задач имеет неверную форму.");
    }
    if (!payload.data.every(isTask)) {
      throw invalidResponse("Задача в ответе не прошла проверку.");
    }
    return { tasks: payload.data, meta: validateMeta(payload.meta, payload.data, "getTasks") };
  }

  async function getTaskById(id, options = {}) {
    validateId(id, "getTaskById");
    const payload = await client.requestJson(`/tasks/${id}`, { signal: options.signal });
    if (!payload || typeof payload !== "object" || !isTask(payload.data)) {
      throw invalidResponse("Ответ с задачей имеет неверную форму.");
    }
    return payload.data;
  }

  async function getCategories(options = {}) {
    const payload = await client.requestJson("/categories", { signal: options.signal });
    if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
      throw invalidResponse("Ответ с категориями имеет неверную форму.");
    }
    if (!payload.data.every(isCategory)) {
      throw invalidResponse("Категория в ответе не прошла проверку.");
    }
    return payload.data;
  }

  async function loadInitialData(filters = {}, options = {}) {
    const [taskResult, categories] = await Promise.all([
      getTasks(filters, options),
      getCategories(options),
    ]);
    return {
      tasks: taskResult.tasks,
      categories,
      meta: taskResult.meta,
    };
  }

  async function createTask(draft, options = {}) {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
      throw new TypeError("Черновик задачи должен быть объектом.");
    }
    // Тело создания не содержит id и completed: их назначает сервер.
    const body = {
      title: draft.title,
      priority: draft.priority,
      categoryId: draft.categoryId,
    };
    const payload = await client.requestJson("/tasks", {
      method: "POST",
      body,
      signal: options.signal,
    });
    if (!payload || typeof payload !== "object" || !isTask(payload.data)) {
      throw invalidResponse("Ответ о создании задачи имеет неверную форму.");
    }
    return payload.data;
  }

  async function updateTask(id, changes, options = {}) {
    validateId(id, "updateTask");
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
      throw new TypeError("Изменения задачи должны быть объектом.");
    }
    const body = {};
    for (const key of ["title", "completed", "priority", "categoryId"]) {
      if (key in changes) body[key] = changes[key];
    }
    if (Object.keys(body).length === 0) {
      throw new TypeError("Нужно передать хотя бы одно изменяемое поле.");
    }
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body,
      signal: options.signal,
    });
    if (!payload || typeof payload !== "object" || !isTask(payload.data)) {
      throw invalidResponse("Ответ об изменении задачи имеет неверную форму.");
    }
    return payload.data;
  }

  async function setTaskCompleted(id, completed, options = {}) {
    validateId(id, "setTaskCompleted");
    if (typeof completed !== "boolean") {
      throw new TypeError("completed должен быть логическим значением.");
    }
    return updateTask(id, { completed }, options);
  }

  async function deleteTask(id, options = {}) {
    validateId(id, "deleteTask");
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "DELETE",
      signal: options.signal,
    });
    if (payload !== null) {
      throw invalidResponse("Ожидался пустой ответ 204 при удалении.");
    }
    return null;
  }

  async function resetDemoData(options = {}) {
    const payload = await client.requestJson("/debug/reset", {
      method: "POST",
      signal: options.signal,
    });
    const data = payload && payload.data;
    if (!data || typeof data !== "object" || data.reset !== true || !Number.isSafeInteger(data.total) || data.total < 0) {
      throw invalidResponse("Ответ о reset имеет неверную форму.");
    }
    return { reset: true, total: data.total };
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
  };
}
