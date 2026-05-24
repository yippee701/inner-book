---
name: image-generator
description: 生成用于小红书发布的封面图和正文图。
---

# INNER BOOK 图片生成

支持两种能力：**封面图**（标题+高亮）与 **正文图**（长正文、自动分页）。

---

## 一、封面图生成

根据标题和可选背景 ID 生成单张封面图，支持 `<s></s>` 高亮与 `<br>` 换行。

### bash 命令（本地）
```bash
node image-generator/cover-image-generator.js "妇女节这天,</br>我<s>拉黑</s>了那个说<s>\"女生不用太努力\"</s>的亲戚" 1
```

### 参数

| 参数   | 类型   | 必填 | 说明 |
|--------|--------|------|------|
| title  | string | 是   | 标题。强调用 `<s>...</s>` 包裹；换行用 `</br>` 或 `<br>` |
| bgId   | number | 否   | 背景图 ID，默认 1。1=带文案底图，2=纯背景 |

### 返回
单张图片，输出为当前目录下 `output-cover.jpg`（或接口返回的 imageUrl）。

### 执行步骤（封面图）
1. 从用户消息中提取或确认**封面标题**和背景图 ID；强调词用 `<s></s>`，换行用 `</br>` 或 `<br>`。
2. 调用封面图接口（见 skill 入口说明），并将生成结果保存到目标目录，需要做“保存到目标目录”这一步，用于我可能会需要回溯之前生成的图片。
3. 目标目录：`/root/.openclaw/workspace-inner-book-operation/rednote-image`，其下按「年月日+标题拼音」建子目录；若为同/相似标题的再次生成，可复用目录并对图片编号避免覆盖。
4. 先把图片复制到 `/tmp`，执行 `ls -la /tmp/文件名` 确认存在后再发送给用户。**重要**：发送给用户时，图片标签不要换行，全部放在一行内，例如：`<qqimg>/tmp/1.jpg</qqimg><qqimg>/tmp/2.jpg</qqimg>`。
5. 把图片直接回复给用户，不要只回复地址。
6. 失败时根据错误信息提示用户（如检查标题格式或稍后重试）。

---

## 二、正文图生成

根据长正文和可选背景 ID 生成一张或多张正文图（内容过长时自动分页）。无高亮，左对齐，固定上下边距；换行处会多留一空行。

### bash 命令（本地）
```bash
node image-generator/text-image-generator.mjs "第一段正文内容。\n\n第二段内容。" 2
```

### 参数

| 参数    | 类型   | 必填 | 说明 |
|---------|--------|------|------|
| content | string | 是   | 正文内容。换行用 `\n` 或 `<br>`； |
| bgId    | number | 否   | 背景图 ID，默认 2 |

### 返回
- 单页：单张图片（如 `output-text.jpg` 或接口返回的 image / imageUrl）。
- 多页：多张图片按顺序编号（如 `output-text-1.jpg`, `output-text-2.jpg` 或接口返回的 `images` 数组）。

### 执行步骤（正文图）
1. 从用户消息中提取或确认**正文内容**和背景图 ID（默认 2）。
2. 调用正文图接口（见 skill 入口说明）；若为多张，按返回的 `images` 或本地生成的文件依次处理。并将生成结果保存到目标目录，需要做“保存到目标目录”这一步，用于我可能会需要回溯之前生成的图片
3. 目标目录规则同封面图；多张时在目录内保存为带编号的文件（如 `output-text-1.jpg`, `output-text-2.jpg`）。
4. 先复制到 `/tmp` 并确认文件存在，再将图片直接回复给用户（多张则一并提供）。
5. 失败时根据错误信息提示用户（如检查 content 或稍后重试）。

---

## 三、报告生成

根据给定的人物说明，通过多轮 Q&A（提问者：inner-book 聊天接口；回答者：外部 LLM 接口）生成一段人物报告，直到回答中出现 `[Report]` 并提取写入 `report-content.md`。

### bash 命令（本地）
```bash
node image-generator/report-image-generator/chat-to-report.mjs "<回答者系统提示词>" [INNER_BOOK_TOKEN]
```
- 第 1 个参数：回答者系统提示词（人物设定，即 answerPrompt），必填。
- 第 2 个参数：`INNER_BOOK_CHAT_TOKEN`。


### 断点与恢复
- 每步成功后会在**同目录**写入 `chat-checkpoint.json`（包含 answerPrompt、innerBookToken、对话消息、轮次、下一步 questioner/answerer）。
- **再次运行**时，若存在 `chat-checkpoint.json` 且未显式关闭恢复，会从断点继续（控制台会输出「从断点恢复: round=…, nextStep=…」）。
- **要从头开始**：删除 `chat-checkpoint.json`，或在编程调用时传 `runChatToReport({ resume: false })`。
- 正常结束（已提取报告或达到最大轮次）后会自动清除断点文件。

### 返回
- 成功：报告内容写入 `image-generator/report-image-generator/report-content.md`。
- 多轮对话耗时较长，中途每一轮的输出都可以返回给用户；若中途失败，把失败信息告诉用户，并可直接再次执行同一命令，脚本会从断点继续，无需从头开始。

### 执行步骤（生成报告）
1. 打开浏览器，访问 https://inner-book.top/，等待页面加载完毕，从 localStorage 中读取 key=credentials_inner-book-0gdweqyu8ab70e46 的值，从值里取出 access_token 字段，作为 INNER_BOOK_CHAT_TOKEN参数。
2. 从用户消息中提取**人物设定**，作为第 1 个参数（回答者系统提示词）。
3. 执行：`node image-generator/report-image-generator/chat-to-report.mjs "<人物设定>" <chatToken>`。
4. 等待报告最终输出；报告在 `image-generator/report-image-generator/report-content.md`。
5. 按「四、报告图生成」用上一步生成的 `report-content.md` 生图，不要从用户消息里再读正文。

---

## 四、报告图生成

根据标题和报告内容生成一张报告的长截图，注意，报告图通过用浏览器访问真实的 HTML，再进行长截图生成。内容过长时也绝对不要分页。

### bash 命令（本地）
```bash
npm run build:report
```

### 参数
| 参数    | 类型   | 必填 | 说明 |
|---------|--------|------|------|
| title   | string | 是   | 标题 |
| content | string | 是   | 正文内容 |
| mode    | number | 否   | 模式 |

### 执行步骤（报告图）
1. 用户可以直接提供报告内容（从用户消息中提取或确认**标题**和**正文**和**模式**），或者提供人物设定，通过章节「三、模拟报告生成」生成报告内容。
2. 把正文消息保存到 /root/.openclaw/workspace-inner-book-operation/skills/rednote-image-generator/image-generator/report-image-generator/report-content.md
3. 执行上述 bash 命令，会生成 report-result.html 文件，确定 report-result.html 存在。如果用户没有提供标题，而且 report-result.html 文件内容中存在一级标题，那么把这个作为**标题**
4. 打开浏览器，并且把浏览器切换到移动端浏览模式
5. 使用浏览器访问 /root/.openclaw/workspace-inner-book-operation/skills/rednote-image-generator/image-generator/report-image-generator/report-result.html
6. 截图并保存到 /tmp 目录
7. 把图片发送给用户

## 通用注意

- 封面图 = 标题 + 高亮，单张；正文图 = 长正文、无高亮、可多张。
- 用户说「封面」「头图」「标题图」→ 用封面图能力（title + bgId）；用户说「正文图」「长文图」→ 用正文图能力（content + bgId）。用户说「报告图」→ 用报告图能力。用户说「生成报告」→ 先调用「报告生成」，再调用「报告图」
