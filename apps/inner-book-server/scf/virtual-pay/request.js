function requestJson(method, urlString, payload, headers = {}) {
  const body = payload === undefined ? "" : JSON.stringify(payload);
  const url = new URL(urlString);

  return new Promise((resolve, reject) => {
    const req = https.request(
      buildRequestOptions(method, url, body, headers),
      (res) => {
        const chunks = [];

        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          const data = text ? safeJsonParse(text) : {};

          if (res.statusCode >= 400) {
            const error = new Error(`HTTP ${res.statusCode}: ${text}`);
            error.code = "HTTP_ERROR";
            error.statusCode = res.statusCode;
            error.response = data;
            reject(error);
            return;
          }

          resolve(data);
        });
      }
    );

    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function buildRequestOptions(method, url, body, headers = {}) {
  return {
    method,
    protocol: url.protocol,
    hostname: url.hostname,
    path: `${url.pathname}${url.search}`,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body || ""),
      ...headers,
    },
  };
}

function safeJsonParse(input) {
  if (typeof input !== "string") {
    return input;
  }

  try {
    return JSON.parse(input);
  } catch (error) {
    return input;
  }
}

module.exports = {
  requestJson,
};
