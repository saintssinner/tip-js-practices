"use strict";

// Вариант 7: Михайлова София, ЭФБО-13-25
const totalTasks = 5;
const completedTasks = 6;


if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом.");
}
else if (totalTasks < 0 || totalTasks > 1000) {
  console.log("Ошибка: общее количество задач должно быть в диапазоне 0…1000.");
}
else if (completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше, чем существует, либо отрицательное значение.");
}
else if (totalTasks === 0 && completedTasks === 0) {
  console.log("Задач пока нет");
}
else {
  const remainingTasks = totalTasks - completedTasks;
  const percentage = completedTasks / totalTasks * 100;

  let status;
  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks === totalTasks) {
    status = "Завершено";
  } else {
    status = "В работе";
  }

  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remainingTasks}`);
  console.log(`Прогресс: ${percentage.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}