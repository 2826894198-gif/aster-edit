# Aster Edit · 品牌体验与独立交易服务

**从品牌内容、系列故事与商品选择，连接到独立运行的账户、订单和客户服务。**

这个仓库把 Aster Edit 的英文品牌商城与 WooCommerce 交易服务放在同一个项目入口，方便理解一件商品从展示、选购到订单访问的完整路径。代码按运行职责分开：前端负责内容与购买体验；交易服务负责服务端校验、账户、订单和官方支付集成。

> 当前阶段：经整理的公开源码与合成数据演示。合仓不等于统一部署，也不代表真实商户、付款、退款、邮件或对账已完成验收。

## 项目亮点

- 系列、Shop、搜索与完整商品页形成连贯的英文购买旅程。
- Prism 十二星座选择、Vertex 八个 SKU 与购物袋映射保持在前端模块。
- 独立 WooCommerce 服务承接账户、购物袋交接、同订单恢复、订单访问与评价审核。
- 商品内容、公开展示素材、AI 展示图和真实交易证据分别说明，不用合成指标宣称经营效果。

## 目录与技术

| 模块 | 职责 | 技术与独立配置 |
| --- | --- | --- |
| [apps/storefront](apps/storefront/README.md) | 品牌、商品内容、选择与购买入口 | React、Vite、响应式图片、静态预渲染；独立 npm 依赖与示例环境配置 |
| [services/commerce](services/commerce/README.md) | 账户、订单、访问控制、官方支付与客户服务 | PHP、WordPress/WooCommerce、MariaDB、Docker Compose、Mailpit；独立本地密钥与数据卷 |
| [docs](docs/ARCHITECTURE.md) | 架构、启动、来源、验证与限制 | 不保存部署凭据或真实业务记录 |

两套模块共享版本管理，不共享运行数据库、密钥、构建目录或部署生命周期。前端默认不连接真实商户后端；官方 WooCommerce PayPal Payments 保持支付生命周期的所有权。

## 快速开始

前端需要 Node.js 22+。在本仓库根目录运行：

```sh
npm --prefix apps/storefront ci
npm --prefix apps/storefront run dev
```

普通构建默认是 `noindex` 预览：

```sh
npm --prefix apps/storefront run build
```

交易服务需要 Node.js 和 Docker Desktop。只在准备好独立本地合成数据环境后运行：

```sh
make commerce-bootstrap
make commerce-verify
make commerce-stop
```

这些命令从 `services/commerce/` 启动原有本地流程，生成该模块自己的随机密钥，使用本机回环端口和 Mailpit。不要向演示环境导入真实商户凭据、客户或订单。完整命令、端口和 metadata 模式见 [启动说明](docs/SETUP.md)。

## 验证与已知边界

- 批准的前端快照记录了完整构建通过、28 条预渲染路由，以及 240 条响应式记录对应的 795 个公开衍生变体。
- production **metadata** 模式的定向检查为 **8 通过 / 1 未通过**；保留的未通过项是杯页章节锚点断言。未为通过检查而修改页面或删除断言。
- 本次合仓进行结构、路径和静态入口核对，不重新启动 Docker、执行商户操作或重跑上述重型验证。
- 购买入口和合成订单演示不代表真实 PayPal 付款、capture、webhook、退款、外部邮件或到账对账已通过。
- 公共包保留选定的公开商品展示素材和衍生图，不包含私有原图、采购档案或真实业务截图。Prism 的 AI 展示图应继续保留相应标识，不能当作实拍证据。

详细结果见 [验证记录](docs/VALIDATION.md) 与 [已知问题](docs/KNOWN_ISSUES.md)。

## 协作与来源

模块各自保留原说明、权利文件和已知问题；合仓来源见 [来源与历史](docs/SOURCES.md)。贡献规则见 [CONTRIBUTING.md](CONTRIBUTING.md)，敏感问题见 [SECURITY.md](SECURITY.md)，代码与素材权利见 [RIGHTS.md](RIGHTS.md)。公开访问不新增开源或素材再分发授权。
