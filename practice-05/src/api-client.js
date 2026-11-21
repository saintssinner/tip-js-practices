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

// Проверяет baseUrl: абсолютный http/https-адрес без query и hash.
// Возвращает объект URL, чтобы дальше работать с ним стандартными средствами.
function parseBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("baseUrl должен быть непустой строкой.");
  }

  let url;
  try {
    url = new URL(baseUrl);
  } catch (cause) {
    // Относительный адрес вроде "/api" не разбирается без основы.
    throw new TypeError("baseUrl должен быть абсолютным адресом.", { cause });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать http или https.");
  }
  if (url.search !== "" || url.hash !== "") {
    throw new TypeError("baseUrl не должен содержать query и hash.");
  }
  return url;
}

// Проверяет время ожидания: положительное целое число миллисекунд.
function checkTimeout(value) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError("timeoutMs должен быть положительным целым числом.");
  }
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  const url = parseBaseUrl(baseUrl);

  if (typeof path !== "string" || path.trim() === "") {
    throw new TypeError("path должен быть непустой строкой.");
  }
  // Схема в начале ("http:") или "//" делают путь абсолютным.
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) {
    throw new TypeError("path должен быть относительным.");
  }
  if (path.includes("?") || path.includes("#")) {
    throw new TypeError("Параметры запроса передаются через query, а не через path.");
  }
  if (query === null || typeof query !== "object" || Array.isArray(query)) {
    throw new TypeError("query должен быть обычным объектом.");
  }

  // Убираем лишние "/" по краям, чтобы не получить двойной разделитель.
  const basePart = url.pathname.replace(/^\/+|\/+$/g, "");
  const pathPart = path.replace(/^\/+|\/+$/g, "");
  if (pathPart === "") {
    throw new TypeError("path должен содержать имя ресурса.");
  }
  url.pathname = basePart === "" ? `/${pathPart}` : `/${basePart}/${pathPart}`;

  for (const [name, value] of Object.entries(query)) {
    // Пропускаем только undefined, null и "". Значения false и 0 нужны.
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.append(name, String(value));
  }

  return url.toString();
}

// Определяет, почему завершился запрос с отказом: время, отмена или сеть.
function classifyFailure(cause, { url, combinedSignal, timeoutSignal, timeoutMs }) {
  const timeoutError = () => new ApiError(
    `Превышено время ожидания ответа (${timeoutMs} мс).`,
    { kind: "timeout", url, cause },
  );
  const abortedError = () => new ApiError(
    "Запрос отменён.",
    { kind: "aborted", url, cause },
  );

  if (combinedSignal.aborted) {
    // Причина общего сигнала совпадает с причиной того сигнала, который сработал первым.
    return combinedSignal.reason === timeoutSignal.reason && timeoutSignal.aborted
      ? timeoutError()
      : abortedError();
  }
  if (cause?.name === "TimeoutError") return timeoutError();
  if (cause?.name === "AbortError") return abortedError();

  return new ApiError(
    `Не удалось получить ответ от сервера: ${cause?.message ?? "неизвестная ошибка"}.`,
    { kind: "network", url, cause },
  );
}

function isJsonContentType(response) {
  const contentType = response.headers.get("content-type") ?? "";
  return /application\/(?:[\w.+-]+\+)?json/i.test(contentType);
}

// Создаёт HTTP-ошибку из ответа. Тело читаем осторожно: оно может быть не JSON.
async function createHttpError(response, url) {
  let payload = null;
  if (isJsonContentType(response)) {
    try {
      payload = await response.json();
    } catch {
      // Тело ошибки повреждено: статус всё равно известен, поэтому вид остаётся http.
      payload = null;
    }
  }

  const apiError = payload && typeof payload === "object" ? payload.error : null;
  const hasError = apiError !== null && typeof apiError === "object";
  const message = hasError && typeof apiError.message === "string"
    ? apiError.message
    : `Сервер вернул HTTP ${response.status}.`;

  return new ApiError(message, {
    kind: "http",
    status: response.status,
    code: hasError && typeof apiError.code === "string" ? apiError.code : null,
    details: hasError && apiError.details !== undefined ? apiError.details : null,
    url,
  });
}

// fetchFn передаётся явно, чтобы модуль можно было проверить без реальной сети.
// Возвращаемый объект: { requestJson(path, { query, signal, timeoutMs } = {}) }.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  const normalizedBaseUrl = parseBaseUrl(baseUrl).toString();
  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }
  checkTimeout(timeoutMs);

  async function requestJson(path, {
    query,
    signal,
    timeoutMs: requestTimeoutMs = timeoutMs,
  } = {}) {
    checkTimeout(requestTimeoutMs);
    const url = buildUrl(normalizedBaseUrl, path, query);

    // Сигнал тайм-аута, при необходимости объединённый с внешним сигналом.
    const timeoutSignal = AbortSignal.timeout(requestTimeoutMs);
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;
    const failureContext = {
      url,
      combinedSignal,
      timeoutSignal,
      timeoutMs: requestTimeoutMs,
    };

    // В try находится только вызов fetch: так HTTP-ошибки не станут сетевыми.
    let response;
    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: combinedSignal,
      });
    } catch (cause) {
      throw classifyFailure(cause, failureContext);
    }

    if (!(response instanceof Response)) {
      throw new ApiError("fetchFn вернул не Response.", {
        kind: "invalid-response",
        url,
      });
    }

    if (!response.ok) {
      throw await createHttpError(response, url);
    }

    if (response.status === 204) {
      return null;
    }

    if (!isJsonContentType(response)) {
      throw new ApiError(
        `Ожидался JSON, получен Content-Type: ${response.headers.get("content-type") ?? "нет"}.`,
        { kind: "invalid-response", status: response.status, url },
      );
    }

    try {
      return await response.json();
    } catch (cause) {
      // Время могло закончиться или запрос могли отменить во время чтения тела.
      if (combinedSignal.aborted) {
        throw classifyFailure(cause, failureContext);
      }
      throw new ApiError("Тело ответа не является корректным JSON.", {
        kind: "invalid-response",
        status: response.status,
        url,
        cause,
      });
    }
  }

  return { requestJson };
}
