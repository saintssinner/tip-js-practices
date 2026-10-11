"use strict";

console.log("Задание 2. Типы и преобразования.\n");

console.log('1) "8" + 2');
console.log("   Результат:", "8" + 2);
console.log("   Тип:", typeof ("8" + 2));
console.log();

console.log('2) "8" - 2');
console.log("   Результат:", "8" - 2);
console.log("   Тип:", typeof ("8" - 2));
console.log();

console.log('3) Number("8") + 2');
console.log("   Результат:", Number("8") + 2);
console.log("   Тип:", typeof (Number("8") + 2));
console.log();

console.log('4) "12" > "3"');
console.log("   Результат:", "12" > "3");
console.log("   Тип:", typeof ("12" > "3"));
console.log();

console.log('5) 12 === "12"');
console.log("   Результат:", 12 === "12");
console.log("   Тип:", typeof (12 === "12"));
console.log();

console.log('6) Number("")');
console.log("   Результат:", Number(""));
console.log("   Тип:", typeof Number(""));
console.log();

console.log('7) Number("text")');
console.log("   Результат:", Number("text"));
console.log("   Тип:", typeof Number("text"));
console.log();

console.log('8) Boolean("false")');
console.log("   Результат:", Boolean("false"));
console.log("   Тип:", typeof Boolean("false"));
console.log();

console.log('9) typeof null');
console.log("   Значение:", typeof null);
console.log("   Тип результата выражения:", typeof (typeof null));
console.log();

console.log('10) typeof NaN');
console.log("   Значение:", typeof NaN);
console.log("   Тип результата выражения:", typeof (typeof NaN));