# 前后端隔离与接入契约 v1（部分实现）

2026-09-22 接线更新：用户现已授权展示前端接线，账户/查单入口、设备本地选品保留、38 个固定单品映射及短效交接调用已实现并在本地验证。本文下方“前端尚未接入/无需改动”是最初阶段说明，由此更新取代。生产构建不连接本地 Woo；PayPal、正式商品和生产验收尚未完成。

本文件记录稳定边界。只有下方标明“已实现”的端点可以现在调用，其余不应在前端假定已经存在。

## 隔离清单

| 资源 | 前端 | 交易后端 |
| --- | --- | --- |
| 工作目录 | `盲盒独立站` | 相邻的 `aster-commerce` |
| Git | 原有历史和未提交修改 | 独立 `.git`、独立分支 |
| 依赖 | 现有 Vite/React | Docker 内 WordPress/PHP/MariaDB |
| 数据 | 商品展示资料与页面素材 | 专属 Docker volume，虚构测试数据 |
| 端口 | 原有开发端口，不修改 | 127.0.0.1:8088 / 邮件 8028 |
| 发布 | 现有流程 | 后续独立构建、发布与回滚 |
| 密钥 | 不接触 | `.secrets/`，Git 忽略 |

当前没有共享 Cookie、API Key、数据库、运行依赖、目录挂载或软链接。

## 商品标识和金额

- 前端可任意修改布局、图片、文字、URL；选品用稳定 `catalog_key`。38 个单品键见 `catalog/launch-drafts.v1.json`，如 `fangju-yellow-petal:05` 对应档案 8 寸花瓣圆盘；4 个套装键及其组件清单见 `catalog/commercial-review.v1.json`，如 `fangju-yellow-petal:full-set`。
- 后端维护 `catalog_key → Woo product_id / variation_id / sku` 映射。商品名、图片数组下标、页面 slug 不可用作数据库 ID。
- 浏览器仅提交商品键和正整数数量；实际币种、价格、优惠、税费和运费由 Woo 重算。
- Woo ID 可以因测试库重建改变；稳定业务键保持不变。未映射/停售/缺货明确报错，不能自动替换为其他 SKU。
- 展示价格来自后台并使用币种最小单位约定；不要假设所有币种都是两位小数。JSON 中金额使用字符串，数量使用整数。
- 不导入前端概念套装价。受控导入工具已读取固定档案快照，38 条均为未定价草稿，不依赖前端模块。业务键分配后不得因排序、名称和价格变化而改变，不要重新生成快照覆盖既有键。

## V1 接入路径

1. 前端展示与选择；购物袋可以继续独立开发。
2. 将商品键和数量交给交易域的交接流程；后端创建/校验其自己的购物车。
3. 顶层导航到交易域上的 Woo Checkout Blocks，地址、账户和支付由 Woo 页面管理。
4. 订单确认、账户、查单位于交易域，提供返回 Aster 的普通链接。

交接 V1 已在独立本地后端实现，展示前端尚未接入，非 local 环境默认关闭。仅传商品键和数量，后端签发 5 分钟一次性链接（随机值仅放 fragment），进入交易页后移除 fragment，检查服务端价格/库存并确认后进入原生 Woo Checkout。没有 PII、订单 key、管理密钥或自定义跳转目标。已有 Woo 购物袋时展示并保留原内容；V1 不自动合并或覆盖。详见 `checkout-handoff.md`。

不向浏览器开放 Woo 管理 REST API 凭据，不让前端调用自写 capture。第三方 Cookie 被禁用时也应可通过顶层导航正常结账。

## 接口状态

| 接口 | 所有者 | 状态 |
| --- | --- | --- |
| `GET /wp-json/aster/v1/health` | Aster 环境插件 | 已实现，只有最小服务信息 |
| `/wp-json/wc/store/v1/products` | Woo Store API | 安装后可用；只返回 Woo 可公开商品 |
| `/wp-json/wc/store/v1/cart*` | Woo Store API | 原生；写入遵循 Nonce/Cart Token、session 规则 |
| `/wp-json/wc/store/v1/checkout` | Woo + 支付插件 | 原生；支付须先连接 Sandbox 并验证 |
| `/my-account/` | Woo | 原生账户页面，登录状态保护 |
| `POST /wp-json/aster/v1/checkout-handoffs` | Aster | 本地已实现，精确 Origin 白名单，credentials omit |
| `/checkout-handoff/` | Aster | 本地已实现，选品复核及原生购物袋交接 |
| `POST /wp-json/aster/v1/order-access-requests` | Aster | 已实现，同源申请邮箱链接 |
| `POST /wp-json/aster/v1/order-access/exchange` | Aster | 已实现，单次链接换单订单只读 Cookie |
| `GET /wp-json/aster/v1/order-access/order` | Aster | 已实现，必须持有效 Cookie，无订单号参数 |
| `POST /wp-json/aster/v1/order-access/logout` | Aster | 已实现，撤销访问 |
| `/order-status/` | Aster | 已实现，独立后端功能页 |
| 物流/售后扩展 | Aster | 待实现，不编造响应数据 |

当前前端无需改任何文件。后端通过独立测试客户端或 Woo 原生页面验收，不要求修改首页、详情页或现有购物袋。

查单细节见 `order-access-security.md`。页面只允许交易域自身调用，前端未来应顶层导航到查单页，不跨域传邮箱或持有只读 Cookie。原生 API 可用不表示 PayPal Sandbox 已验收。
