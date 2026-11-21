// Собственные проверки ПР5 (вариант 7). Их нет в готовых наборах.
// Часть проверок идёт через реальный API, часть — через подменённый fetchFn.
import assert from "node:assert/strict";
import { createApiServer } from "../api/server.mjs";
import { ApiError, buildUrl, createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { variantFilters } from "../src/variant.js";

let passed = 0;
let failed = 0;

async function check(name, action) {
  try {
    await action();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error.stack ?? error.message);
  }
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${server.address().port}/api`;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function catchError(action) {
  try {
    await action();
  } catch (error) {
    return error;
  }
  return undefined;
}

const server = createApiServer();
const baseUrl = await listen(server);
const client = createApiClient({ baseUrl, timeoutMs: 1000 });
const api = createTaskApi(client);

try {
  // Случай 1: своя комбинация query-параметров (кодирование).
  await check("С1. спецсимволы в q кодируются и читаются обратно без потерь", () => {
    const text = "100% а+б & в=г #1";
    const url = new URL(buildUrl("http://localhost:5505/api", "/tasks", {
      q: text,
      completed: true,
      priority: "medium",
    }));
    assert.equal(url.searchParams.get("q"), text);
    assert.equal(url.searchParams.get("completed"), "true");
    assert.equal(url.searchParams.get("priority"), "medium");
    assert.equal(url.hash, "");
  });

  await check("С2. реальный API: completed=true, priority=medium, categoryId=3 даёт [10]", async () => {
    const result = await api.getTasks({
      completed: true,
      priority: "medium",
      categoryId: 3,
    });
    assert.deepEqual(result.tasks.map((task) => task.id), [10]);
    assert.equal(result.meta.total, 1);
  });

  // Вариант 7: тот же набор фильтров, что в src/variant.js.
  await check("С3. вариант 7: фильтры из variant.js дают id [7, 16] и total 2", async () => {
    assert.deepEqual(variantFilters, { q: "провер" });
    const result = await api.loadInitialData(variantFilters);
    assert.deepEqual(result.tasks.map((task) => task.id), [7, 16]);
    assert.equal(result.meta.total, 2);
    assert.equal(result.meta.filters.q, "провер");
    assert.equal(result.categories.length, 3);
  });

  // Случай 2: дополнительные ошибочные HTTP-сценарии.
  await check("С4. отсутствующая категория 99 даёт http 404 CATEGORY_NOT_FOUND", async () => {
    const error = await catchError(() => client.requestJson("/categories/99"));
    assert.ok(error instanceof ApiError);
    assert.equal(error.kind, "http");
    assert.equal(error.status, 404);
    assert.equal(error.code, "CATEGORY_NOT_FOUND");
    assert.deepEqual(error.details, { id: 99 });
  });

  await check("С5. неверный id в пути даёт http 400 INVALID_ID, а не network", async () => {
    const error = await catchError(() => client.requestJson("/tasks/abc"));
    assert.ok(error instanceof ApiError);
    assert.equal(error.kind, "http");
    assert.equal(error.status, 400);
    assert.equal(error.code, "INVALID_ID");
  });

  // Случай 3: границы отмены и тайм-аута.
  await check("С6. сигнал, отменённый до вызова, сразу даёт aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await catchError(() => client.requestJson("/debug/delay", {
      query: { ms: 100 },
      signal: controller.signal,
    }));
    assert.ok(error instanceof ApiError);
    assert.equal(error.kind, "aborted");
  });

  await check("С7. неотменённый внешний сигнал не мешает тайм-ауту", async () => {
    const controller = new AbortController();
    const error = await catchError(() => client.requestJson("/debug/delay", {
      query: { ms: 150 },
      signal: controller.signal,
      timeoutMs: 20,
    }));
    assert.ok(error instanceof ApiError);
    assert.equal(error.kind, "timeout");
  });

  // Граница схемы: данные корректного JSON, но неверной формы.
  await check("С8. категории с повторяющимся id отклоняются как invalid-response", async () => {
    const fake = createTaskApi({
      async requestJson() {
        return {
          data: [{ id: 1, name: "А" }, { id: 1, name: "Б" }],
          meta: { total: 2 },
        };
      },
    });
    const error = await catchError(() => fake.getCategories());
    assert.ok(error instanceof ApiError);
    assert.equal(error.kind, "invalid-response");
  });
} finally {
  await close(server);
}

console.log(`\nИтог собственных проверок: успешно ${passed}, ошибок ${failed}.`);
if (failed > 0) process.exitCode = 1;
