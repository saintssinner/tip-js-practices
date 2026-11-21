const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const value = {
    title: typeof draft?.title === "string" ? draft.title.trim() : "",
    priority: typeof draft?.priority === "string" ? draft.priority : "",
    categoryId: null,
  };
  if (draft?.categoryId !== undefined && draft?.categoryId !== null && draft?.categoryId !== "") {
    const numeric = typeof draft.categoryId === "number" ? draft.categoryId : Number(draft.categoryId);
    if (Number.isSafeInteger(numeric)) value.categoryId = numeric;
  }
  const errors = {};
  if (!value.title || value.title.length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов.";
  }
  if (!ALLOWED_PRIORITIES.has(value.priority)) {
    errors.priority = "Приоритет должен быть low, medium или high.";
  }
  const categoryIds = new Set(
    (Array.isArray(categories) ? categories : [])
      .map((category) => category?.id)
      .filter((id) => Number.isSafeInteger(id) && id > 0),
  );
  if (value.categoryId === null) {
    errors.categoryId = "Выберите категорию.";
  } else if (!categoryIds.has(value.categoryId)) {
    errors.categoryId = "Выбрана несуществующая категория.";
  }
  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    value: valid
      ? { title: value.title, priority: value.priority, categoryId: value.categoryId }
      : value,
    errors,
  };
}
