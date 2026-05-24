import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'report-result.html');
const outputPath = path.join(__dirname, 'report-image.jpg');
const PORT = 8765;

// 简单 HTTP 服务器
const server = http.createServer((req, res) => {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

async function screenshot() {
  server.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
    
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });
    
    // 等待内容加载完成
    await page.waitForSelector('body');
    
    // 获取完整页面高度
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewport({ width: 800, height: height });
    
    await page.screenshot({ 
      path: outputPath,
      fullPage: true
    });
    
    await browser.close();
    server.close();
    console.log('Screenshot saved to:', outputPath);
  });
}

screenshot().catch(console.error);
