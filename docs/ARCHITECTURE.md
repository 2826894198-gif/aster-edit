# 架构与模块边界

Aster Edit 按商品的使用路径组织同一仓库中的两套模块：

```text
品牌内容与系列故事
        ↓
apps/storefront：Shop / 搜索 / 商品选择 / 购物袋
        ↓ 显式配置的交接契约；公开演示不默认连接真实商户
services/commerce：账户 / 订单访问 / 恢复 / 客户服务
        ↓ 只有独立配置与验收后才可使用真实商户服务
WordPress / WooCommerce / 官方 PayPal Payments
```

## 前端

`apps/storefront/` 保留 React/Vite 应用、商品内容、稳定商品键、响应式图片 manifest、静态预渲染和对应测试。npm 依赖、环境示例、构建输出和可选平台打包配置均相对于这个模块。

普通构建使用 preview metadata，预期为 noindex。production metadata 模式仅改变静态元数据，不会部署，也不能替代商户配置和支付验收。

## 交易服务

`services/commerce/` 保留 PHP/WordPress/WooCommerce 扩展、商品契约、本地 Docker Compose、Mailpit、初始化与验证脚本。服务的本地配置、密钥、运行包和数据卷归该模块所有；Compose 的相对挂载路径继续从该模块解析。

购物袋交接与订单访问由服务端验证。官方 WooCommerce PayPal Payments 保持创建、授权、capture、退款及支付回调处理的所有权，不能增加竞争的支付写入器。

## 合仓没有改变的边界

- 不共享前端与服务的运行数据库、密钥、环境文件或部署目录。
- 不通过运行时源码挂载或共享服务数据库把两个模块耦合起来。
- 不从公开演示的购物入口、跳转页、合成付款或测试邮件推导真实交易成功。
- 不把原始私有素材、采购记录、客户或订单数据加入公开代码。
- 不改变 UI、商品事实、价格规则、购物袋业务逻辑或支付行为。

本地入口见 [SETUP.md](SETUP.md)，具体代码和契约见两个模块各自的说明。
