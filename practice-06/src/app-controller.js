import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";
export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}
const REQUIRED_API_METHODS = [
  "loadInitialData",
  "getTasks",
  "createTask",
  "updateTask",
  "setTaskCompleted",
  "deleteTask",
  "resetDemoData",
];
const REQUIRED_VIEW_METHODS = [
  "setListState",
  "setCategories",
  "setTasks",
  "setTotal",
  "setFormTask",
  "showFormErrors",
  "setMutationPending",
  "notify",
];
function requireMethods(value, methods, label) {
  if (!value || typeof value !== "object") {
    throw new TypeError(`${label} должен быть объектом.`);
  }
  for (const name of methods) {
    if (typeof value[name] !== "function") {
      throw new TypeError(`${label}.${name} должен быть функцией.`);
    }
  }
}
// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  requireMethods(api, REQUIRED_API_METHODS, "api");
  requireMethods(view, REQUIRED_VIEW_METHODS, "view");
  if (typeof validateDraft !== "function") {
    throw new TypeError("validateDraft должен быть функцией.");
  }
  let tasks = [];
  let categories = null;
  let filters = {};
  let editingId = null;
  let activeLoad = null;
  let sequence = 0;

  function isAbortError(error) {
    return Boolean(
      error
      && (error.kind === "aborted" || error.name === "AbortError"),
    );
  }

  async function load(filtersNext, { forceInitial = false } = {}) {
    if (activeLoad) {
      activeLoad.controller.abort();
      activeLoad = null;
    }
    const controller = new AbortController();
    const seq = ++sequence;
    activeLoad = { controller, seq };
    const useInitial = forceInitial || !categories;
    try {
      view.setListState("loading");
      const result = useInitial
        ? await api.loadInitialData(filtersNext, { signal: controller.signal })
        : await api.getTasks(filtersNext, { signal: controller.signal });
      // Устаревший результат не отрисовывается.
      if (seq !== sequence || controller.signal.aborted) return;
      if (Array.isArray(result.categories)) {
        categories = result.categories;
        view.setCategories(categories);
      }
      tasks = Array.isArray(result.tasks) ? result.tasks : [];
      view.setTasks(tasks, categories ?? []);
      view.setTotal(result.meta?.total ?? tasks.length);
      view.setListState(tasks.length === 0 ? "empty" : "ready");
    } catch (error) {
      if (seq !== sequence || controller.signal.aborted) return;
      if (isAbortError(error)) return;
      view.setListState("error", messageForError(error));
    } finally {
      if (activeLoad?.seq === seq) activeLoad = null;
    }
  }

  // Общая схема изменяющих операций: блокировка → запрос → уведомление
  // → повторная загрузка списка → разблокировка.
  async function withMutation(action) {
    view.setMutationPending(true);
    try {
      await action();
      view.notify("Операция выполнена.", "success");
      await load(filters);
      return true;
    } catch (error) {
      view.notify(messageForError(error), "error");
      return false;
    } finally {
      view.setMutationPending(false);
    }
  }

  return {
    async start(filtersNext = {}) {
      filters = { ...filtersNext };
      await load(filters, { forceInitial: true });
    },
    async applyFilters(filtersNext = {}) {
      filters = { ...filtersNext };
      await load(filters);
    },
    async refresh() {
      await load(filters);
    },
    async submit(draft) {
      const { valid, value, errors } = validateDraft(draft, categories ?? []);
      if (!valid) {
        view.showFormErrors(errors);
        return;
      }
      view.showFormErrors({});
      const idAtStart = editingId;
      const ok = await withMutation(async () => {
        if (idAtStart !== null) {
          await api.updateTask(idAtStart, value);
        } else {
          await api.createTask(value);
        }
      });
      if (ok) {
        editingId = null;
        view.setFormTask(null);
      }
    },
    beginEdit(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      editingId = id;
      view.setFormTask(task);
    },
    cancelEdit() {
      editingId = null;
      view.setFormTask(null);
    },
    async toggleTask(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      await withMutation(() => api.setTaskCompleted(id, !task.completed));
    },
    async deleteTask(id) {
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      await withMutation(() => api.deleteTask(id));
    },
    async resetData() {
      await withMutation(() => api.resetDemoData());
    },
    destroy() {
      sequence += 1;
      if (activeLoad) {
        activeLoad.controller.abort();
        activeLoad = null;
      }
    },
  };
}

export { ApiError };
