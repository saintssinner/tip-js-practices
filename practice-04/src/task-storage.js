export const STORAGE_VERSION = 1;

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();
  for (const task of value) {
    if (!task || typeof task !== "object") return false;
    if (!Number.isSafeInteger(task.id) || task.id <= 0) return false;
    if (ids.has(task.id)) return false;
    ids.add(task.id);
    if (typeof task.title !== "string" || task.title.trim() === "" || task.title.length > 100) return false;
    if (typeof task.completed !== "boolean") return false;
    if (!["low", "medium", "high"].includes(task.priority)) return false;
  }
  return true;
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = fallbackTasks.map(t => ({ ...t }));
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { ok: true, tasks: fallback, source: "initial" };
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION || !isValidTaskList(parsed.tasks)) {
      return { ok: false, tasks: fallback, source: "fallback", error: "Неверная схема данных" };
    }
    return { ok: true, tasks: parsed.tasks.map(t => ({ ...t })), source: "storage" };
  } catch (e) {
    return { ok: false, tasks: fallback, source: "fallback", error: "Ошибка чтения JSON" };
  }
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) return { ok: false, error: "Неверная схема данных" };
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Ошибка записи в хранилище" };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Ошибка удаления" };
  }
}