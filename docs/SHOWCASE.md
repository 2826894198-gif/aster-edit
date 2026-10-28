# Aster Commerce · 独立交易与客户服务 · 项目展示

## 一句话介绍

前端专注品牌体验，后端承接账户、订单与支付，让交易服务独立运行。

## 项目价值

将 Aster Edit 的账户、购物袋交接、官方 PayPal 结账、订单访问与评价管理拆成独立 WooCommerce 服务，并提供本地隔离环境与发布门禁。

## 最值得展示的能力

- WordPress/WooCommerce 原生账户、地址、购物车、订单与 HPOS
- 官方 WooCommerce PayPal Payments 管理支付生命周期
- 购物袋跨域交接、同订单恢复与服务端访问控制

## 展示依据

- README.md
- AGENTS.md
- docs/status.md
- docs/system-design.md
- docs/order-access-security.md
- docs/integrated-purchase-local-acceptance-20261016.md

## 说明范围

当前阶段：独立后端开发快照；2026-09-28 正式结账入口已开放，10-15 结账迁移与 10-16 客服集成功能有明确发布记录。未完成商户真实付款验收。

- 根 README 仍有初版本地范围，后续状态以 docs/status.md、AGENTS 与相邻前端发布记录为准。
- 本地 phase-one/two/three 包含合成付款/邮件/汇率预览，不能当生产模块部署。
- 正式发信仍受已认证发件人门控；外部邮件送达未验收。
- 真实 PayPal 付款、webhook、退款、到账对账仍缺商户验收。
- 官方 PayPal 插件拥有支付写入，不能实现竞争的 payment writer。
- 源码快照不含生产数据库、客户订单、持久化设置或完整生产凭据，不能称生产镜像。

对外演示使用合成数据。源码、演示、历史验收记录与实时线上状态分别说明；任何效果数字都需要可追溯的测量记录。
