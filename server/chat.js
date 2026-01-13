function onRequest(request, response, modules) {
  const http = modules.oHttp;
  const HOST_NAME = 'sg.uiuiapi.com';
  const OPENAIAPIKEY = ""; // 请在环境变量中配置

  const prompt = '你是谁';

  // 2. 构造 OpenAI 请求体 
  const bodyData = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: request.body.temperature || 0.7,
      maxtokens: request.body.maxtokens || 8192,
      stream: true

  };

  const options = {
      "url": `https://${HOST_NAME}/v1/chat/completions`,
      "headers": {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAIAPIKEY}`,
      },
      "body": JSON.stringify(bodyData)
  };

  // response.send(Object.getOwnPropertyNames(modules.oHttp));
  http.post(options, function (error, res, body) {
          var result = JSON.parse(body)
          response.send(result.access_token);
      })
      .on("response", (openaiRes) => {
          // 3.1 非 200 状态处理 
          if (openaiRes.statusCode !== 200) {
              let errData = "";
              openaiRes.on("data", chunk => errData += chunk);
              openaiRes.on("end", () => {
                  response.send(`${openaiRes.statusCode};${openaiRes.req.path};${openaiRes.req.path};${openaiRes.rawHeaders}`);
                  let errMsg = errData;
                  try {
                      const errJson = JSON.parse(errData);
                      if (errJson.error && errJson.error.message) {
                          errMsg = errJson.error.message;

                      }

                  } catch (e) {}
                  response.end("chatGPT 返回错误：" + errMsg);
              });
              return;

          }
          // 3.2 成功，设置流式响应头 
          response.writeHead(200, {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive"

          });
      })
      .on("data", chunk => { response.write(chunk); })
      .on("end", () => { response.end(); })
      .on("error", err => {
          response.end("请求 chatGPT 失败：" + err.message);
      });

}