function onRequest(_request, response, modules) {
  const http = modules.oHttp;
  const HOST_NAME = 'sg.uiuiapi.com';
  const OPENAI_API_KEY = ""; // 请在环境变量中配置

  const prompt = '你是谁';

  // 构造 OpenAI 请求体 
  const bodyData = {
      model: "gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      temperature:  0.7,
      maxtokens:  8192,
      stream: true

  };

  const options = {
      "url": `https://${HOST_NAME}/v1/chat/completions`,
      "headers": {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      "body": JSON.stringify(bodyData)
  };

  // 流式请求
  http.post(options)
      .on("response", function(openaiRes) {
          // 非 200 状态处理 
          if (openaiRes.statusCode !== 200) {
              var errData = "";
              openaiRes.on("data", function(chunk) { errData += chunk; });
              openaiRes.on("end", function() {
                  var errMsg = errData;
                  try {
                      var errJson = JSON.parse(errData);
                      if (errJson.error && errJson.error.message) {
                          errMsg = errJson.error.message;
                      }
                  } catch {
                    // 忽略解析错误
                  }
                  response.end("chat 接口返回错误：" + errMsg);
              });
              return;
          }

          // 成功，设置流式响应头
          response.writeHead(200, {
              "Content-Type": "text/plain; charset=utf-8",
              "Transfer-Encoding": "chunked",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive"
          });

          // 监听响应数据流
          openaiRes.on("data", function(chunk) {
              var lines = chunk.toString().split('\n');
              for (var i = 0; i < lines.length; i++) {
                  var line = lines[i];
                  var trimmed = line.trim();
                  if (!trimmed || trimmed.indexOf('data:') !== 0) continue;
                  
                  var data = trimmed.slice(5).trim();
                  if (data === '[DONE]') continue;
                  
                  try {
                      var parsed = JSON.parse(data);
                      var content = '';
                      if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                          content = parsed.choices[0].delta.content;
                      }
                      if (content) {
                          response.write(content);
                      }
                  } catch {
                      // 忽略解析错误
                  }
              }
          });

          openaiRes.on("end", function() {
              response.end();
          });

          openaiRes.on("error", function(err) {
              response.end("流读取错误：" + err.message);
          });
      })
      .on("error", function(err) {
          response.end("请求失败：" + err.message);
      });
}
