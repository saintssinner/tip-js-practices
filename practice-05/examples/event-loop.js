const log = (label) => console.log(label);

log("A: синхронный код");

setTimeout(() => {
  log("F: задача таймера");
}, 0);

Promise.resolve().then(() => {
  log("D: обработчик Promise");
});

async function demonstrateAwait() {
  log("B: начало async-функции");
  await null;
  log("E: продолжение после await");
}

demonstrateAwait();

// Собственный обработчик (задание 2, пункт 6).
// Он регистрируется после D и после await в demonstrateAwait, поэтому ожидается после E.
Promise.resolve().then(() => {
  log("G: собственный обработчик Promise");
});

log("C: конец синхронного кода");

// До запуска записать прогноз порядка A–F в отчёт, затем объяснить результат.
