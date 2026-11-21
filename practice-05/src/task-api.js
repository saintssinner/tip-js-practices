import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTask(value) {
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

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// Проверяет фильтры до запроса и возвращает новый объект query.
// Исходный объект filters не изменяется. false сохраняется как логическое значение:
// в строку его превращает URLSearchParams внутри buildUrl.
function normalizeFilters(filters) {
  if (!isPlainObject(filters)) {
    throw new TypeError("filters должен быть обычным объектом.");
  }

  const query = {};
  for (const [name, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(name)) {
      throw new TypeError(`Неизвестный фильтр: ${name}.`);
    }
    if (value === undefined) continue;

    if (name === "completed") {
      if (typeof value !== "boolean") {
        throw new TypeError("completed должен быть логическим значением.");
      }
      query.completed = value;
    } else if (name === "priority") {
      if (!ALLOWED_PRIORITIES.has(value)) {
        throw new TypeError("priority должен быть low, medium или high.");
      }
      query.priority = value;
    } else if (name === "categoryId") {
      if (!isPositiveSafeInteger(value)) {
        throw new TypeError("categoryId должен быть положительным целым числом.");
      }
      query.categoryId = value;
    } else {
      if (typeof value !== "string") {
        throw new TypeError("q должен быть строкой.");
      }
      const text = value.trim();
      if (text.length > 100) {
        throw new TypeError("q не должен быть длиннее 100 символов.");
      }
      if (text !== "") query.q = text;
    }
  }
  return query;
}

// Проверяет общую форму коллекции: data — массив, id не повторяются,
// meta.total равен длине data.
function readCollection(payload, isItem, itemName) {
  if (!isPlainObject(payload)) {
    throw invalidResponse("Ответ должен быть объектом.");
  }
  if (!Array.isArray(payload.data)) {
    throw invalidResponse(`Поле data должно быть массивом (${itemName}).`);
  }
  if (!payload.data.every(isItem)) {
    throw invalidResponse(`Получен элемент, не соответствующий схеме (${itemName}).`);
  }

  const ids = new Set(payload.data.map((item) => item.id));
  if (ids.size !== payload.data.length) {
    throw invalidResponse(`В ответе повторяются id (${itemName}).`);
  }

  if (!isPlainObject(payload.meta) || payload.meta.total !== payload.data.length) {
    throw invalidResponse(`meta.total не равен длине data (${itemName}).`);
  }
  return payload;
}

export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client должен содержать метод requestJson.");
  }

  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query });
    const checked = readCollection(payload, isTask, "задачи");
    if (!isPlainObject(checked.meta.filters)) {
      throw invalidResponse("meta.filters должен быть объектом.");
    }
    return { tasks: checked.data, meta: checked.meta };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id должен быть положительным целым числом.");
    }
    const payload = await client.requestJson(`/tasks/${id}`);
    if (!isPlainObject(payload) || !isTask(payload.data)) {
      throw invalidResponse("Задача в ответе не соответствует схеме.");
    }
    return payload.data;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");
    return readCollection(payload, isCategory, "категории").data;
  }

  async function loadInitialData(filters = {}) {
    // Оба запроса начинаются до общего await: они независимы друг от друга.
    const tasksPromise = getTasks(filters);
    const categoriesPromise = getCategories();
    const [{ tasks, meta }, categories] = await Promise.all([
      tasksPromise,
      categoriesPromise,
    ]);
    return { tasks, categories, meta };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}
