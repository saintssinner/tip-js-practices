"use strict";

// Вариант 7: Михайлова София, ЭФБО-13-25
const totalTasks = 10;
const completedTasks = 7;
const dailyLimit = 3;

if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом.");
}
else if (totalTasks < 0 || totalTasks > 1000) {
  console.log("Ошибка: общее количество задач должно быть в диапазоне 0…1000.");
}
else if (completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше, чем существует, либо отрицательное значение.");
}
else if (!Number.isInteger(dailyLimit)) {
  console.log("Ошибка: дневная норма должна быть целым числом.");
}
else if (dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневная норма должна быть в диапазоне 1…1000.");
}
else if (totalTasks === 0 && completedTasks === 0) {
  console.log("Задач пока нет");
  console.log("Потребуется дней: 0");
}
else if (completedTasks === totalTasks) {
  console.log("Все задачи уже выполнены");
  console.log("Потребуется дней: 0");
}
else {
  let remaining = totalTasks - completedTasks;
  let day = 0;

  console.log(`Осталось задач: ${remaining}`);

  while (remaining > 0) {
    day += 1;
    const doneToday = Math.min(dailyLimit, remaining);
    remaining -= doneToday;
    console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`);
  }

  console.log(`Потребуется дней: ${day}`);
}