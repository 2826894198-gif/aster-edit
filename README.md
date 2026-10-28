# Aster Commerce · 独立交易与客户服务

**前端专注品牌体验，后端承接账户、订单与支付，让交易服务独立运行。**

将 Aster Edit 的账户、购物袋交接、官方 PayPal 结账、订单访问与评价管理拆成独立 WooCommerce 服务，并提供本地隔离环境与发布门禁。

> 当前阶段：独立交易服务源码，默认运行在本地隔离环境；真实商户接入单独验收。

## 项目亮点

- 购物袋、账户、订单与售后独立承接，便于品牌前端持续迭代。
- 保留 WooCommerce 与官方 PayPal 流程，将订单访问和恢复校验放到服务端。
- 用本地环境和合成订单演示客户旅程，配置与生产数据相互独立。

## 技术实现

PHP 8.3 · WordPress · WooCommerce HPOS · 官方 WooCommerce PayPal Payments · MariaDB 11.4 · Docker Compose · Mailpit · Node.js 与 PHP 测试

- compose.yaml
- wordpress/mu-plugins/aster-commerce.php
- wordpress/mu-plugins/aster-commerce/
- wordpress/mu-plugins/aster-checkout-foundation.php
- wordpress/mu-plugins/aster-customer-care.php
- scripts/bootstrap-local.sh

## 快速开始

Node.js 与 Docker Desktop；所有账户、订单和邮件检查限本地虚构数据。

```sh
sh scripts/bootstrap-local.sh
sh scripts/verify-local.sh
# Stop while preserving local fixture data:
docker compose stop
```

本地入口：账户 http://127.0.0.1:8088/my-account/，邮件箱 http://127.0.0.1:8028/。初始化只生成本地随机密钥，合成 fixture 不代表真实付款验收。

## 目录导航

```text
.gitignore
AGENTS.md
catalog/
compose.yaml
docs/
scripts/
tests/
versions.lock.json
wordpress/
```

## 交付状态与证据

- README.md
- AGENTS.md
- docs/history/IMPLEMENTATION_HISTORY.md
- docs/system-design.md
- docs/order-access-security.md
- docs/releases/integrated-features-20261016.md

- 历史实现范围已整理到 docs/history/IMPLEMENTATION_HISTORY.md；公开版不保留内部部署台账。
- 本地 phase-one/two/three 包含合成付款/邮件/汇率预览，不能当生产模块部署。
- 正式发信仍受已认证发件人门控；外部邮件送达未验收。
- 真实 PayPal 付款、webhook、退款、到账对账仍缺商户验收。
- 官方 PayPal 插件拥有支付写入，不能实现竞争的 payment writer。
- 源码快照不含生产数据库、客户订单、持久化设置或完整生产凭据，不能称生产镜像。

本次整理的核验结果见 [仓库状态](docs/REPOSITORY_STATUS.md)，项目介绍口径见 [展示说明](docs/SHOWCASE.md)。

## 协作与使用

- 安装依赖前核对项目所需运行时，配置文件使用示例值；凭据和真实业务数据不进入 Git。
- 提交与反馈请见 [CONTRIBUTING.md](CONTRIBUTING.md)；敏感问题处理见 [SECURITY.md](SECURITY.md)。
- 许可证与第三方资源见 [RIGHTS.md](RIGHTS.md)。公开访问不等于获得所有素材的再分发许可。
