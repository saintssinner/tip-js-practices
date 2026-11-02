export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id;

  if (editingId !== null) {
    id = editingId;
    if (!tasks.some(t => t.id === id)) {
      errors.id = "Задача для редактирования не найдена";
    }
  } else {
    const rawId = String(draft.id || "").trim();
    if (rawId === "") {
      errors.id = "ID не может быть пустым";
    } else {
      id = Number(rawId);
      if (!Number.isSafeInteger(id) || id <= 0) {
        errors.id = "ID должен быть целым положительным числом";
      } else if (tasks.some(t => t.id === id)) {
        errors.id = "Задача с таким ID уже существует";
      }
    }
  }

  let title;
  if (typeof draft.title !== "string") {
    errors.title = "Название обязательно";
  } else {
    title = draft.title.trim();
    if (title.length < 1 || title.length > 100) {
      errors.title = "Название должно быть от 1 до 100 символов";
    }
  }

  const validPriorities = ["low", "medium", "high"];
  if (!validPriorities.includes(draft.priority)) {
    errors.priority = "Неверный приоритет";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: { id, title, priority: draft.priority } };
}