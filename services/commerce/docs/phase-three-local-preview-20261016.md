# 第三批：SEO 与多币种本地预览

用户于 2026-10-16 接受第二批并授权第三批本地实现。未发布，没有支付方请求或对外邮件。保持当前 Aster 字体、白色画布、商品照片和原有 URL；不改动独立的首页/杯子内容审阅稿。前两批功能保留。

## 打开与体验

- 总入口：http://127.0.0.1:8088/aster-preview/discovery/
- SEO：http://127.0.0.1:8088/aster-preview/discovery/?view=seo
- 币种场景：http://127.0.0.1:8088/aster-preview/discovery/?view=currency
- 杯页：http://localhost:5188/products/rolling-bead-ceramic-cup?money-preview=1
- 构建后初始 HTML：http://127.0.0.1:5190/（SEO 面板也有 Open built HTML 链接）

本地 Vite 已运行在 5188，Woo 为 8088，构建后的 HTML 由 `scripts/serve-seo-preview.mjs` 在 127.0.0.1:5190 提供；该入口替换本地规范地址，保留 301 跳转，所有响应加 noindex，不接受 POST。5173 属于其他项目，未使用。前台的币种预览仅在开发环境且 URL 带 `money-preview=1` 时加载，普通页面仍为 USD。预览标记与币种选择在站内跳转/本会话刷新后保留。测试入口不加入生产导航或 sitemap。

在杯页顶部选择币种，选颜色、数量并加入购物袋。继续后进入服务器生成的 15 分钟报价，可显式保存 TEST ONLY Woo 订单，查看未发送的原生邮件，再记录本地退款。页面不会收集付款资料、加载支付 SDK、调用扣款/退款 API 或发送邮件。测试退款是原币种的 Woo 数据记录，**不代表曾付款或已实际退回资金**。

## SEO

- 首页使用方案中的 Curated Ceramic Tableware & Fidget Mug 标题，杯页更新独立标题、描述与真实商品简介。
- 初始 HTML 使用同一套 React 页面完整预渲染，含一个 H1、正文、真实图片和站内链接；JS 导航更新 title/description/canonical/OG/Twitter/JSON-LD，清除旧页面的结构化数据。
- 分享图片使用本项目照片。About 使用 AboutPage；Shop/Collections/混合器型系列使用 CollectionPage。Shop/Collections 列出真实系列链接，不把一组碗盘写成单个商品。
- 杯子仍 noindex。没有 Product、Offer、ProductGroup、Review、AggregateRating 或测试评价评分输出。
- `?colour=purple-grey|olive|deep-green` 可直接选择对应杯子/图片，统一规范到杯页主地址；币种/测试参数也不生成新规范页。普通章节锚点不改变收录设定。
- 本地所有页面保留 noindex，sitemap 为空；生产方向仍只保留原 11 个已计划页面。杯子、Waterline、Cute、搜索、交易/账户、参数和测试页面不进入 sitemap。原系列改名重定向不变。
- 本地 SEO 面板读取构建生成的实际页面与 schema 快照，可逐页查看搜索摘要/H1/规范地址/索引设定，不是搜索引擎收录或排名证据。

相关官方文档核对：[Google 产品结构化数据](https://developers.google.com/search/docs/appearance/structured-data/product)、[Google 商品变体](https://developers.google.com/search/docs/appearance/structured-data/product-variants)。

## 多币种

- 候选：USD、GBP、EUR、CAD、AUD、HKD。USD 基础目录、SKU、库存、商品授权设定和普通结账保护不变。
- 本地快照 `aster-synthetic-fx-v1` 使用明确标记的**合成测试汇率**：1、0.78、0.92、1.37、1.51、7.8；不是当日市场汇率，不进行外部汇率抓取。
- 服务器按每件 USD 价格转换到最小货币单位并取整，再乘数量；前台同算法。购物袋合计按换算后的行金额相加，不把整袋 USD 总价再换算一次。
- 杯子单独购买免费运输。混合订单用原 USD 小计判断 150 门槛，再以同一快照换算 30 运费。USD 128 组合收运费，USD 196 组合免费。
- 报价仅接受目录键、数量、币种与有效快照标识；客户端价格、合计、汇率均不作为依据。未知/重复商品、错误数量、无价格/缺货、过期快照被拒绝。
- 原生 Woo 订单冻结币种、汇率、各行金额、运费和快照，退款保留原订单币种。原生未发送邮件也读取该订单。修改前台币种不重算既有订单。
- 使用同源校验、nonce、限流、15 分钟报价、原子锁和重复提交保护。仅允许配置过的 loopback 前台 CORS；不提供凭据型跨域访问。正常预览页返回 200，过期链接 410，无效表单 403。
- 关闭/无法取得汇率接口时，实测恢复 USD 并显示可重试提示；不保留其他币种标签配 USD 数字。恢复后 Retry 可重新选择币种。
- 新的第三批测试单排除第二批店主提醒，原有真实状态/第二批测试逻辑不受影响。

**非预览路径保持 USD，其他币种未开放。** [PayPal 币种文档](https://developer.paypal.com/api/codes/currency/)不证明 Aster 独立商户账户及各官方付款方式已开通这些币种。多币种上线仍需逐币种商户收款、capture/webhook、Woo 状态、邮件、退款和对账验收。没有复制 JWK 的 Stripe、结算币种、账户或凭据。

## 验证与布局

- 前端构建与 57 项测试通过；默认构建无 currency-preview API、合成汇率快照或币种预览模块。
- 原本地 Woo `scripts/verify-local.sh` 全套通过，目录、账户、购物袋、结账基础和隔离保护保留。第一、第二批的 7 项流程回归也通过。
- `tests/aster-currency.test.mjs`：按单件取整、错误汇率、币种白名单、规范地址、锚点、真实图片和 schema 边界。
- 独立 Woo `tests/phase-three.php`：六种币种、杯子/混合运费、冻结、重复提交、退款原币种、过期报价、错误输入；普通结账仍关闭。
- `tests/phase-three-built-http.mjs`：通过 HTTP 检查 12 个完整初始 HTML、规范地址、noindex、旧地址 301、空 sitemap 和静态服务器边界。
- `tests/phase-three-local-http.mjs`：浏览器链路使用的 API 与原生表单、CORS、服务器价格、nonce、原生邮件金额、退款、邮件数量不变、无支付 SDK、页面 noindex。
- 实际浏览器覆盖 1440/768/390/320：总览、SEO、币种场景、订单、邮件、杯页与购物袋；无横向溢出。桌面相关内容并排，窄屏改为单列，按钮与输入保持可操作尺寸，分组/对齐统一，未增加填充内容。
- 证据：`qa/phase-three-local-20261016/`；尺寸与金额记录为 `responsive-checks.json`。测试日志在 `.codex-tmp/phase-three-*.log`。

## 源码与恢复

前台：`src/aster/CurrencyContext.jsx`、`CurrencyPreview.jsx`、`currency-model.js`，及已有页面的上下文价格接入；SEO 为 `src/seo/` 与构建脚本。独立后端：`aster-commerce/wordpress/mu-plugins/aster-phase-three.php` 和 `aster-phase-three/`。JWK 只读参考哈希保存在后端 `source.json`；没有运行时依赖。

重新生成 SEO 预览快照：先构建前台，再执行 `node scripts/prepare-phase-three-preview.mjs`；将生成的 `seo.json` 更新到独立后端同名目录。预览开关为本地 Woo 的 `aster_phase_three_preview=yes`；关闭开关并移除前台 URL 的预览参数即可回到默认 USD 体验。无需变更商品价格或生产配置。
