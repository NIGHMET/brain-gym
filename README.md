# 脑力健身房 💗

为她定制的每日 5 分钟脑力训练 PWA（iPhone 主屏幕 App 体验），零依赖、零后端、完全免费。

## 训练内容（对应五个能力维度）

| 游戏 | 练什么 | 依据 |
|---|---|---|
| 🧠 位置记忆 | 视空间工作记忆广度（Corsi 积木测验改编）+ 记忆策略提示 | Gross 2012 / Chen 2022（记忆策略训练元分析） |
| 🎨 颜色冲突 | 抑制控制、认知灵活度（Stroop 任务） | Butler 2018（领域特异训练综述） |
| ⚡ 瞬间眼力 | 加工速度 / 注意范围（UFOV 有用视野任务简化版） | ACTIVE 试验；Edwards 2017（10 年随访，证据最硬） |
| 🔢 闪电心算 | 口算流畅度，连对自动升级 | 算术流畅度训练常规做法 |
| 🧩 图形推理 | 归纳推理（瑞文式矩阵） | Butler 2018（推理训练领域特异提升） |

设计原则（详见 App 内「这个 App 为什么有效？」）：
练哪强哪不吹 IQ、难度自适应、每天 5 分钟贵在坚持、记忆先教策略、成绩只做追踪不做医学结论。

## 本地预览

```bash
cd brain-gym
python -m http.server 8123
# 浏览器打开 http://localhost:8123 （手机 F12 切换移动端视图体验最佳）
```

> 注意：直接双击 index.html（file:// 协议）也能玩，但 PWA 安装和离线缓存需要 http(s)。

## 发布到 iPhone（免费，无需开发者账号）

1. 把整个 `brain-gym` 文件夹推到 GitHub 仓库，开启 **Settings → Pages**（或用 Vercel / Netlify 拖拽上传）。
2. iPhone 用 Safari 打开 `https://你的用户名.github.io/仓库名/`。
3. 分享按钮 → **添加到主屏幕** → 确认。之后从主屏幕图标打开即是全屏 App。
4. 数据存在她自己手机的 localStorage 里，重装浏览器数据会丢，训练前在「我的」里确认名字已填。

## 目录结构

```
brain-gym/
├── index.html            入口
├── manifest.webmanifest  PWA 配置
├── sw.js                 离线缓存（改代码后把 CACHE 版本号 +1）
├── css/style.css         全部样式（支持深色模式）
├── js/
│   ├── core.js           工具函数 + 游戏注册表
│   ├── db.js             localStorage 数据层（打卡/进度/自适应难度）
│   ├── audio.js          WebAudio 合成音效
│   ├── games/            5 个游戏，各自独立文件
│   ├── ui.js             页面渲染 + 雷达图 + 结算
│   └── app.js            入口
├── icons/                自动生成的 PWA 图标
└── tools/make_icon.py    图标生成脚本（python tools/make_icon.py）
```

## 后续可加的功能（路线图）

- 双人模式：两台手机轮流答题比分数（需要加个免费后端如 Supabase）
- 翻牌配对：用你们的照片当牌面
- iOS 主屏幕推送提醒（需 iOS 16.4+，添加到主屏幕后允许通知）
- 双 n-back 工作记忆进阶模式
