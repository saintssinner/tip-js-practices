"use strict";

const totalInput = "12";
const completedInput = "5";

if (typeof totalInput !== "string" || typeof completedInput !== "string") {
  console.log("Ошибка: на вход должны быть переданы строки.");
}
else {

  const totalTrimmed = totalInput.trim();
  const completedTrimmed = completedInput.trim();


  if (totalTrimmed === "" || completedTrimmed === "") {
    console.log("Ошибка: пустой ввод или строка только из пробелов.");
  }
  else {

    const totalTasks = Number(totalTrimmed);
    const completedTasks = Number(completedTrimmed);


    if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
      console.log("Ошибка: после преобразования получено не целое число.");
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
  }
}