import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

let currentTasks = demoTasks;

function printStatsStep(stepName, tasks) {
  const stats = getTaskStats(tasks);
  console.log(`\n--- ${stepName} ---`);
  console.log(`Всего: ${stats.total} | Выполнено: ${stats.completed} | Осталось: ${stats.pending} | Прогресс: ${stats.progress.toFixed(1)}%`);
  console.log("Названия задач:", getTaskTitles(tasks));
}

printStatsStep("Исходный набор", currentTasks);

let res = addTask(currentTasks, 20, "Добавить проверку", "high");
if (res.ok) {
  currentTasks = res.tasks;
  printStatsStep("После добавления id = 20", currentTasks);
}

res = setTaskCompleted(currentTasks, 4, true);
if (res.ok) {
  currentTasks = res.tasks;
  printStatsStep("После выполнения id = 4", currentTasks);
}

res = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (res.ok) {
  currentTasks = res.tasks;
  printStatsStep("После переименования id = 10", currentTasks);
}
res = removeTask(currentTasks, 7);
if (res.ok) {
  currentTasks = res.tasks;
  printStatsStep("После удаления id = 7", currentTasks);
}

console.log("\n--- Попытка добавить задачу с существующим id = 4 ---");
res = addTask(currentTasks, 4, "Дубликат");
if (!res.ok) {
  console.log("Ошибка успешно перехвачена:", res.error);
}
console.log("Количество задач в demoTasks осталось прежним:", demoTasks.length);
console.log("Идентификаторы demoTasks:", demoTasks.map(t => t.id));



