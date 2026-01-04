# 部署指南 - Know Yourself H5应用

## 快速部署步骤

### 方式1：自动部署（推荐）

GitHub Actions已配置自动部署，只需：

1. **推送代码到main分支**
```bash
git push origin main
```

2. **等待GitHub Actions完成**
   - 打开你的仓库 → Actions标签
   - 查看"Deploy to GitHub Pages"工作流
   - 等待绿色对勾出现（表示部署成功）

3. **访问你的应用**
```
https://yippee701.github.io/know-yourself/
```

### 方式2：手动部署

如果你想手动管理部署：

```bash
# 1. 安装依赖（如果还没有）
npm install

# 2. 构建项目
npm run build

# 3. 部署到GitHub Pages
npm run deploy
```

## GitHub Pages配置

确保你的仓库已正确配置GitHub Pages：

1. 打开仓库 → Settings → Pages
2. 确认Source设置为"Deploy from a branch"
3. 选择分支为"gh-pages"
4. 点击Save

## 工作流程说明

### GitHub Actions自动部署流程：

```
推送到main分支
    ↓
触发GitHub Actions工作流
    ↓
检出代码
    ↓
安装Node.js依赖
    ↓
运行npm install
    ↓
构建项目(npm run build)
    ↓
上传dist文件到Pages artifact
    ↓
部署到gh-pages分支
    ↓
应用在GitHub Pages上线
    ↓
访问 https://yippee701.github.io/know-yourself/
```

## 常见问题

### Q: 部署后页面显示404
**A:** 这通常是因为路由配置不正确。项目已配置`base: '/know-yourself/'`，确保所有链接都相对于此基础路径。

### Q: GitHub Actions部署失败
**A:** 检查：
1. Node.js版本（18+）
2. package.json中的依赖
3. build脚本是否能本地运行成功

### Q: 本地运行正常，部署后样式丢失
**A:** 这通常是CSS加载路径问题。确保：
1. vite.config.js中有`base: '/know-yourself/'`
2. Tailwind CSS正确配置

### Q: 如何更新已部署的应用
**A:** 简单！修改代码后：
```bash
git add .
git commit -m "Your message"
git push origin main
```
GitHub Actions会自动重新部署。

## 自定义域名（可选）

如果你想使用自定义域名：

1. 在`public`目录创建`CNAME`文件，内容为你的域名
2. 在域名提供商设置DNS指向GitHub Pages
3. 在仓库Settings → Pages中配置自定义域名

## 性能优化建议

- ✅ 已使用Vite优化构建
- ✅ 已使用Tailwind CSS进行样式优化
- ✅ 生产构建自动压缩JavaScript和CSS
- ✅ 应用是纯静态的，无需服务器

## 环境变量

如果需要使用环境变量：

1. 创建`.env`文件
2. 在GitHub Actions中设置secrets
3. 在工作流中引用这些secrets

示例（.env）：
```
VITE_API_URL=https://api.example.com
VITE_APP_NAME=Know Yourself
```

使用：
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## 监控部署

- 查看Action日志：Repositories → Actions → Workflows
- 监控GitHub Pages：Settings → Pages中查看Last deployment
- 使用GitHub的部署保护规则确保代码质量

## 更多帮助

- GitHub Pages文档：https://docs.github.com/en/pages
- Vite文档：https://vite.dev/
- React文档：https://react.dev/
- Tailwind文档：https://tailwindcss.com/
