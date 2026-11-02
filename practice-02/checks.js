import assert from "node:assert/strict";
import {
  createTask, findTaskById, getPendingTasks, getTaskTitles, getTaskStats,
  addTask, setTaskCompleted, renameTask, removeTask,
} from "./src/task-service.js";

let passed = 0;
let failed = 0;

function check(name, action) {
  try {
    action();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error.message);
  }
}

function fixture() {
  return [
    { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
    { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
    { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
    { id: 10, title: "Оформить README", completed: true, priority: "medium" },
  ];
}

// 1-8: createTask
check("Создание с явным приоритетом", () => {
  const res = createTask(20, "Новая задача", "high");
  assert.equal(res.ok, true);
  assert.equal(res.task.completed, false);
});
check("Приоритет по умолчанию", () => {
  assert.equal(createTask(20, "A").task.priority, "medium");
});
check("Очистка пробелов", () => {
  assert.equal(createTask(20, "  Текст  ").task.title, "Текст");
});
check("Границы длины", () => {
  assert.equal(createTask(1, "x").ok, true);
  assert.equal(createTask(2, "x".repeat(100)).ok, true);
});
check("Некорректные названия", () => {
  ["", "  ", "x".repeat(101), 42, null].forEach(t => {
    assert.equal(createTask(20, t).ok, false);
  });
});
check("Некорректные ID", () => {
  [0, -1, 1.5, "4", NaN, null].forEach(id => {
    assert.equal(createTask(id, "A").ok, false);
  });
});
check("Допустимые приоритеты", () => {
  ["low", "medium", "high"].forEach(p => {
    assert.equal(createTask(20, "A", p).ok, true);
  });
});
check("Недопустимые приоритеты", () => {
  ["urgent", "HIGH", null].forEach(p => {
    assert.equal(createTask(20, "A", p).ok, false);
  });
});

// 9-12: findTaskById
check("Поиск по id", () => {
  const tasks = fixture();
  assert.equal(findTaskById(tasks, 4), tasks[1]);
});
check("Поиск отсутствующей задачи", () => {
  assert.equal(findTaskById(fixture(), 777), undefined);
});
check("Строковый id не найден", () => {
  assert.equal(findTaskById(fixture(), "4"), undefined);
});

// 13-14: getPendingTasks
check("Фильтрация невыполненных", () => {
  const tasks = fixture();
  assert.deepEqual(getPendingTasks(tasks).map(t => t.id), [4, 7]);
});
check("Пустой массив при фильтрации", () => {
  assert.deepEqual(getPendingTasks([]), []);
});

// 15-16: getTaskTitles
check("Получение названий", () => {
  assert.equal(getTaskTitles(fixture()).length, 4);
});

// 17-19: getTaskStats
check("Статистика", () => {
  const s = getTaskStats(fixture());
  assert.equal(s.total, 4);
  assert.equal(s.completed, 2);
});
check("Статистика пустого списка", () => {
  const s = getTaskStats([]);
  assert.equal(s.total, 0);
});

// 20-25: addTask
check("Добавление задачи", () => {
  const res = addTask(fixture(), 20, "A", "high");
  assert.equal(res.ok, true);
  assert.equal(res.tasks.length, 5);
});
check("Добавление в пустой массив", () => {
  const res = addTask([], 20, "A");
  assert.equal(res.tasks.length, 1);
});
check("Дубликат id", () => {
  assert.equal(addTask(fixture(), 4, "A").ok, false);
});

// 26-30: setTaskCompleted
check("Изменение статуса", () => {
  const tasks = fixture();
  const res = setTaskCompleted(tasks, 4, true);
  assert.equal(res.ok, true);
  assert.equal(res.tasks.find(t => t.id === 4).completed, true);
  assert.equal(tasks.find(t => t.id === 4).completed, false); // исходный не изменен
});
check("Неверный статус", () => {
  assert.equal(setTaskCompleted(fixture(), 4, "true").ok, false);
});
check("Изменение несуществующей", () => {
  assert.equal(setTaskCompleted(fixture(), 777, true).ok, false);
});

// 31-33: renameTask
check("Переименование", () => {
  const tasks = fixture();
  const res = renameTask(tasks, 4, "New Name");
  assert.equal(res.tasks.find(t => t.id === 4).title, "New Name");
  assert.equal(tasks.find(t => t.id === 4).title, "Подготовить модель задач");
});
check("Пустое имя", () => {
  assert.equal(renameTask(fixture(), 4, "  ").ok, false);
});

// 34-35: removeTask
check("Удаление", () => {
  const tasks = fixture();
  const res = removeTask(tasks, 7);
  assert.equal(res.tasks.length, 3);
  assert.equal(tasks.length, 4);
});
check("Удаление несуществующей", () => {
  assert.equal(removeTask(fixture(), 777).ok, false);
});

console.log(`\nПроверок пройдено: ${passed}; не пройдено: ${failed}.`);
if (failed > 0) process.exitCode = 1;