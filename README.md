# 深A女性向大学 · 官网

深圳 · 女性向研究型学府（戏仿）。纯静态站点 + Decap 网页后台，托管在 Cloudflare Pages / Netlify。

## 目录

```
shenA-univ/
├─ index.html        首页（含新生分院）
├─ men-chuan.html    男喘系详情页
├─ apply.html        入学申请表（出图）
├─ offer.html        录取通知书（出图）
├─ sorting.html      生日分院（出图）
├─ assets/           style.css · app.js
├─ content/news.json 校园动态数据（后台维护）
├─ admin/            Decap 后台（/admin）
└─ uploads/          后台上传的图片/资料
```

三个生成器（申请表 / 录取通知书 / 分院）全是前端 `html2canvas`，无需服务器。
唯一“活”的是校园动态：后台改 `content/news.json`，首页运行时读取渲染。

## 本地预览

```bash
cd shenA-univ
python3 -m http.server 8080
# 打开 http://localhost:8080
```

后台本地试用（可选）：
```bash
npx decap-server          # 另开一个终端，监听 8081
# 把 admin/config.yml 里的 local_backend 那行取消注释
# 打开 http://localhost:8080/admin
```

## 上线（Netlify，约 10 分钟）

1. 注册 GitHub，新建仓库，把本文件夹内容推上去（站点文件在仓库根目录）。
2. 注册 Netlify → Add new site → Import from Git → 选该仓库 → 构建命令留空、发布目录 `.` → Deploy。几分钟后得到 `xxx.netlify.app`，**站点即上公网**。
3. 开后台：站点设置 → Identity → Enable Identity；再 Identity → Services → Git Gateway → Enable；最后 Identity → Invite users 邀请自己的邮箱（收邮件设密码）。
4. 更新校园动态：打开 `你的域名/admin` → 邮箱登录 → 增删动态 / 传资料 → 保存即自动发布。

> 后台用 git-gateway + Netlify Identity，已在 `admin/config.yml` 配好，无需再改配置。

## 注意

- 公网首页保持“戏仿、不露骨”的尺度，符合托管商条款；露骨内容请留在你现有的成人平台。
- `cocoayan123@gmail.com` 为真实投稿邮箱，已接入诚聘板块与各页“应聘”按钮。
