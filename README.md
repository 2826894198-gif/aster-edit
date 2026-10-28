# Aster Edit · 生活方式电商品牌

**让一个商品系列，拥有从品牌故事到完整购买页的英文电商体验。**

以商品事实和真实素材为基础，把系列故事、完整商品页、响应式图片与购买入口组织成协调的英文电商体验，并保留可追溯的发布与回退证据。

> 当前阶段：基于已发布版本整理的公开演示源码；交易环境使用示例配置。

## 项目亮点

- 系列、搜索、Shop 与商品详情旅程
- Prism 十二星座选择、比较联动与上下文购买条
- Vertex 八个稳定 SKU、购物袋与直接购买映射
- 真实照片与 AI 展示图明确区分
- 响应式图片、静态预渲染与商品 SEO

## 技术实现

React 19 · Vite · CSS 响应式布局 · WordPress/WooCommerce 独立商务服务 · 静态预渲染 · Node.js 测试

- src/main.jsx
- src/aster/HomePage.jsx
- src/aster/ShopPage.jsx
- src/aster/CrystalPage.jsx
- src/aster/VertexCrystalPage.jsx
- src/aster/commerce.js

## 快速开始

Node.js 22+；仓库保留已发布图片 manifest 及其必要公开衍生素材。

```sh
npm ci
npm run dev
# Run in another terminal when needed:
npm run build
npm run test:sites
```

独立预览默认不配置商户后端。images:prepare 是维护命令；原始私有素材不在公开仓库，不要在普通启动时重建 manifest。


### SEO metadata mode

The default build is a `noindex` preview. Production SEO assertions require a production **metadata mode** build; this does not configure or enable a live merchant backend:

```sh
PUBLICATION_MODE=production VITE_PUBLICATION_MODE=production npm run build
node --test tests/crystal-preview.test.mjs tests/aster-prerender.test.mjs
```

The export follow-up passed 8 of these 9 checks. The remaining historical cup chapter-anchor assertion is documented in `docs/REPOSITORY_STATUS.md`; no UI or assertion was removed to change that result.

## 目录导航

```text
docs/
index.html
package-lock.json
package.json
production-build.config.mjs
public/
scripts/
src/
tests/
vite.config.mjs
worker/
```

## 交付状态与证据

- docs/releases/shop-mobile-balance-release-20261027.md
- docs/releases/prism-complete-pdp-release-20261023.md
- docs/releases/vertex-purchase-release-20261022.md
- docs/releases/integrated-features-release-20261016.md
- docs/history/IMPLEMENTATION_HISTORY.md

- 本次整理已按保留 manifest 补入公开衍生图片；未携带私有原始素材。
- 不从 dirty main 或旧 4194 预览发布。
- Prism 十二张杯底可视化为 AI 生成，实拍与生成展示必须区分。
- Vertex 尺寸、容量与供货信息未知，不沿用 Prism 参数。
- 购买入口/结账准备验证不等于真实付款、capture、邮件送达或搜索收录。
- 没有测量转化、收入或排名提升，不能作为营销成效数字。

本次整理的核验结果见 [仓库状态](docs/REPOSITORY_STATUS.md)，项目介绍口径见 [展示说明](docs/SHOWCASE.md)。

## 协作与使用

- 安装依赖前核对项目所需运行时，配置文件使用示例值；凭据和真实业务数据不进入 Git。
- 提交与反馈请见 [CONTRIBUTING.md](CONTRIBUTING.md)；敏感问题处理见 [SECURITY.md](SECURITY.md)。
- 许可证与第三方资源见 [RIGHTS.md](RIGHTS.md)。公开访问不等于获得所有素材的再分发许可。


构建和测试条件、尚未通过的杯页锚点检查见 [已知问题](docs/KNOWN_ISSUES.md)。
