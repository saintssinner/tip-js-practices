export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}
// Соединяет абсолютный baseUrl, путь и непустые query-параметры.
export function buildUrl(baseUrl, path, query = {}) {
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.append(key, String(value));
  }
  const queryString = params.toString();
  if (queryString) url.search = queryString;
  return url.href;
}
// requestJson(path, { method, query, body, signal, timeoutMs } = {})
// поддерживает GET, POST, PATCH и DELETE; ответ 204 преобразуется в null.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  if (typeof baseUrl !== "string" || !baseUrl.trim()) {
    throw new TypeError("baseUrl должен быть непустой строкой.");
  }
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать протокол http или https.");
  }
  if (url.search || url.hash) {
    throw new TypeError("baseUrl не должен содержать query или hash.");
  }
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("timeoutMs должен быть положительным числом.");
  }
  const defaultTimeout = timeoutMs;
  const resolvedFetch = fetchFn;

  return {
    async requestJson(path, {
      method = "GET",
      query = undefined,
      body = undefined,
      signal = undefined,
      timeoutMs: perCallTimeout = defaultTimeout,
    } = {}) {
      if (typeof path !== "string" || !path.trim()) {
        throw new TypeError("path должен быть непустой строкой.");
      }
      if (!Number.isFinite(perCallTimeout) || perCallTimeout <= 0) {
        throw new TypeError("timeoutMs должен быть положительным числом.");
      }
      const normalizedMethod = String(method).toUpperCase();
      if (!["GET", "POST", "PATCH", "DELETE"].includes(normalizedMethod)) {
        throw new TypeError(`Неподдерживаемый метод: ${method}.`);
      }
      if (normalizedMethod === "GET" && body !== undefined && body !== null) {
        throw new TypeError("GET не должен содержать тело запроса.");
      }
      const targetUrl = buildUrl(baseUrl, path, query ?? {});
      const headers = { Accept: "application/json" };
      let payload = undefined;
      if (body !== undefined && body !== null) {
        payload = JSON.stringify(body);
        headers["Content-Type"] = "application/json";
      }
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, perCallTimeout);
      const external = signal;
      const onExternalAbort = () => controller.abort(external?.reason);
      if (external) {
        if (external.aborted) controller.abort(external.reason);
        else external.addEventListener("abort", onExternalAbort, { once: true });
      }
      try {
        const response = await resolvedFetch(targetUrl, {
          method: normalizedMethod,
          headers,
          body: payload,
          signal: controller.signal,
        });
        if (!response.ok) {
          let code = null;
          let message = `Ошибка HTTP ${response.status}.`;
          let details = null;
          try {
            const text = await response.text();
            if (text) {
              const parsed = JSON.parse(text);
              const error = parsed && parsed.error;
              if (error && typeof error === "object") {
                if (typeof error.message === "string" && error.message) message = error.message;
                if (typeof error.code === "string") code = error.code;
                if (error.details !== undefined) details = error.details;
              }
            }
          } catch {
            // Не JSON-тело ошибки: сохраняем только статус.
          }
          throw new ApiError(message, {
            kind: "http",
            status: response.status,
            code,
            details,
            url: targetUrl,
          });
        }
        if (response.status === 204) return null;
        const text = await response.text();
        const contentType = response.headers.get("content-type") ?? "";
        if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
          throw new ApiError("Ожидался JSON-ответ.", {
            kind: "invalid-response",
            status: response.status,
            url: targetUrl,
          });
        }
        let parsedJson;
        try {
          parsedJson = JSON.parse(text);
        } catch (error) {
          throw new ApiError("Ответ не содержит корректный JSON.", {
            kind: "invalid-response",
            status: response.status,
            url: targetUrl,
            cause: error,
          });
        }
        return parsedJson;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (timedOut) {
          throw new ApiError("Сервер не ответил вовремя.", {
            kind: "timeout",
            url: targetUrl,
            cause: error,
          });
        }
        if (external?.aborted || controller.signal.aborted) {
          throw new ApiError("Запрос отменён.", {
            kind: "aborted",
            url: targetUrl,
            cause: error,
          });
        }
        throw new ApiError("Сетевая ошибка запроса к API.", {
          kind: "network",
          url: targetUrl,
          cause: error,
        });
      } finally {
        clearTimeout(timer);
        if (external) external.removeEventListener("abort", onExternalAbort);
      }
    },
  };
}
