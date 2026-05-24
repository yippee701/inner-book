/**
 * 使用本地 markdownToHtml 将 report-content.md 渲染进模板，生成 report-result.html
 * 运行：
 *   node build-report-html.mjs [title] [mode]
 * 参数（可选）：
 *   title - 顶部栏标题，默认「发掘自己」
 *   mode  - 模式标签（如「发掘自己」「了解他人」），默认「发掘自己」
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { markdownToHtml } from './markdown.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCF_DIR = __dirname;

const templatePath = path.join(SCF_DIR, 'report-result.template.html');
const contentPath = path.join(SCF_DIR, 'report-content.md');
const outputPath = path.join(SCF_DIR, 'report-result.html');

const args = process.argv.slice(2);
const titleArg = args[0];
const modeArg = args[1];

const REPORT_TITLE = titleArg ?? '发掘自己';
const MODE_LABEL = modeArg ?? '发掘自己';

const template = readFileSync(templatePath, 'utf-8');
const md = readFileSync(contentPath, 'utf-8');
const bodyHtml = markdownToHtml(md.trim());

let html = template
  .replace(/\{\{REPORT_BODY\}\}/g, bodyHtml)
  .replace(/\{\{REPORT_TITLE\}\}/g, REPORT_TITLE)
  .replace(/\{\{MODE_LABEL\}\}/g, MODE_LABEL);

writeFileSync(outputPath, html, 'utf-8');
console.log('已生成:', outputPath, '| title:', REPORT_TITLE, '| mode:', MODE_LABEL);
