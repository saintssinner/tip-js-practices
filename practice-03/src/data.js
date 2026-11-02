//Михайлова София, ЭФБО-13-25
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Индивидуальный вариант 7 — «Подготовка учебного релиза»
export const variantNumber = 7;

export const variantTasks = [
  { id: 11, title: "Собрать структуру документа релиза",       completed: true, priority: "medium" },
  { id: 23, title: "Вычитать и проверить раздел требований",   completed: true, priority: "high"   },
  { id: 37, title: "Описать детальный порядок сборки",         completed: true, priority: "low"    },
  { id: 41, title: "Подготовить глоссарий основных терминов",  completed: true, priority: "medium" },
  { id: 58, title: "Добавить практические примеры",            completed: true, priority: "low"    },
  { id: 64, title: "Проверить актуальность ссылок",            completed: true, priority: "high"   },
];

import { setTaskCompleted } from "./task-service.js";
const result = setTaskCompleted(demoTasks, 4, true);
console.log("Новая запись id 4:", result.tasks.find((task) => task.id === 4));
console.log("Исходная запись id 4:", demoTasks.find((task) => task.id === 4));
console.log("Отказ 777:", setTaskCompleted(demoTasks, 777, true));

/*// src/task-service.js
function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
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
}*/