# Aster 独立交易体系设计

状态：用户选定 WooCommerce + PayPal；后端本地搭建进行中，前端继续独立迭代。本文是新的设计基准，替代前端仓库里之前的 JWK 模板和 Medusa 候选建议。没有迁移 JWK 代码、客户、订单或支付设置。

## 1. 结构和责任

| 层 | 责任 | 数据归属 |
| --- | --- | --- |
| Aster React 展示站 | 品牌、系列、图片、规格展示、选择商品 | 前端仓库 |
| Woo 商品和购物车 | 可售 SKU、销售价格、币种、库存、优惠、运费、税费 | 本仓库部署的 Woo 数据库 |
| Woo 原生结账与账户 | 收集客户信息、地址验证、购物车转订单、登录、密码恢复、账户历史 | Woo |
| 官方 PayPal Payments | PayPal 创建/买家批准/capture/退款/webhook | 官方插件；PayPal 是资金事实来源 |
| Aster 扩展 | 商品映射、受控前端交接、访客安全查单、必要的售后扩展与异常队列 | 商品草稿、查单、交接和最小权限订单工作台已本地实现；真实发货/对账/售后/完整异常队列待实现 |
| 运维 | cron、备份、恢复、邮件投递、权限、告警、更新 | 本仓库运行手册与环境配置 |

第一版推荐“独立展示站 + Woo 管理的交易页面”。官方 Checkout Blocks 与 PayPal Payments 已有兼容路径；新写的 React 支付按钮不能因 Store API 可用就被视为与插件兼容。前端视觉可以单独迭代，结账模板在交易仓库内独立维护。是否后来将结账也完全做成 Headless，必须通过插件兼容验证后另作决定。

预期生产地址：`asteredit.com` 展示，`commerce.example.test` 交易和账户。这个域名方案尚未配置 DNS/TLS；本机实际地址为 `127.0.0.1:8088`。不得跨子域共享宽域登录 Cookie。跨域交接方式见契约。

不同时维护两套订单引擎或两个 PayPal capture 服务。自定义扩展不能从浏览器回跳直接标记付款、不能在后台定时任务自动重新扣款。

## 2. 客户记录与账户

允许游客下单；建立账户是可选项。订单保存当时的联系/收货/计费快照，账户修改地址不重写历史订单。PayPal payer 信息与商城收货人分开，不以 PayPal 邮箱覆盖订单邮箱。

最小资料：邮箱、收货姓名、国家、必要的地址/城市/邮编/地区；电话按配送需求要求，地址第二行可选。营销同意单独记录，默认不勾选；必要条款保存版本与接受时间。

WordPress/Woo 原生身份、密码哈希、重置密码和客户角色作为基础。客服不会看到密码、完整支付凭据。注册邮箱匹配不能直接将游客订单归到新账号：只有邮箱所有权验证和明确的关联流程通过后才可合并查看。

客户详情需可查订单、退款、物流、公开/内部备注、联系记录和同意情况。订单邮件、营销邮件和内部通知的订阅语义分别处理。资料导出/删除遵循实际销售地与账务保留要求；期限需业务确认，不能简单删除所有交易记录。

## 3. 商品、价格和库存

前端通过稳定 SKU/外部键选品。后台再次读取可售状态、价格、税、库存与配送规则，不接受浏览器提交的总价。每个独立购买器型映射独立 SKU；系列名称、图片排序、页面 URL 变化不改变 SKU。

尚未确认的正式商品导入后为 draft，无可用销售价格；不可用 demo 数字上线。套装必须有真实 BOM 和库存扣减规则才启用。实际包装重量/尺寸用于配送计费。测试库现有 38 个单品草稿和虚构 fixture；USD、US、1 美元测试商品、2 美元测试运费均不是业务决定。

库存预留和取消释放交给 Woo 标准流程；测试并发最后一件、付款晚于预留过期、取消后迟到付款。迟到已收款订单进入人工核对，不能因库存已释放就静默继续发货或再收一次款。

## 4. 购买与付款流程

1. 客户在前端选择 SKU、数量，交接到 Woo 会话。
2. Woo 计算实际可售项目、金额、折扣、税费和配送方式；客户确认邮箱及地址。
3. Woo 结账创建/使用对应订单，官方插件负责 PayPal 付款会话。
4. 买家在 PayPal 批准付款；官方插件按配置执行 capture。
5. 服务端响应和已验证 webhook 更新付款记录；回跳页只显示后台返回的状态。
6. Woo 发送订单确认，客户可在账户或经过验证的游客查单入口查看。
7. 后台审核付款/库存/地址后发货，保存包裹和追踪号，发送物流邮件。

V1 目标为一次性 PayPal 钱包付款，现货订单计划采用即时 capture。高级银行卡、分期、保存支付方式、订阅和多次 capture 不作为默认功能。是否向某买家提供免 PayPal 账户银行卡支付取决于商户资格和 PayPal 展示规则，不能承诺。

必须分别表达订单、付款和履约状态。例：`processing` 是 Woo 业务状态，不是物流已发货；`completed` 也不能替代承运商已签收。授权不是已收款。部分退款后的订单不强行改成全额 refunded。

| 情况 | 客户动作 | 后台处理 |
| --- | --- | --- |
| PayPal 批准但 capture 未确认 | 显示处理中，稍后查看 | 查同一交易，不新建付款 |
| 买家关闭 PayPal 窗口 | 保留购物车，明确未确认收款 | 检查服务端再决定是否允许续付 |
| 请求超时/断网 | 恢复订单状态 | 不因前端报错自动重试 capture |
| 明确失败且无资金完成 | 在原订单允许重试 | 官方续付流程；库存和有效期重新校验 |
| 重复/乱序 webhook | 稳定显示当前状态 | 去重，不重复减库存、发货或退款 |
| 支付已完成但 Woo 待付 | 显示正在核对 | 告警、查 PayPal 交易；单一受控恢复路径 |
| 金额/币种/商户不符 | 不允许继续支付或发货 | 人工异常队列 |

可靠性来自对官方插件在所锁定版本上的实测，而不是声称插件永不出错。自定义代码如需调用 PayPal，须明确 API 的幂等支持和保留窗口。请求去重还需本地记录；不能把一次 disabled 按钮当作防重复扣款。

## 5. 订单查询与售后

账户用户：原生 My Account 订单列表、订单详情、地址、账户资料、密码恢复；所有读取检查订单归属。

游客：已在本地实现“订单号 + 邮箱申请 → 原邮箱收到短效链接 → 主动确认后查看”。公共响应不透露订单是否存在。随机令牌存摘要、短效、单次兑换为受限只读会话，限流按 IP、订单/邮箱及订单摘要执行。页面无第三方追踪脚本；代理日志脱敏仍需生产配置。转账户或改邮箱需重新验证。

Woo 默认订单号/邮箱查询不等于邮箱所有权验证；本地已增加独立邮件链接链路，通过 HTTP/SMTP 测试，生产外部投递仍待验收，详见 order-access-security.md。

客户可提出取消/破损/退货申请；申请和实际退款分开。客服审核后财务通过官方插件执行退款，记录原因、退货商品、退运费策略、退款 ID 和结果。争议/拒付保存 PayPal 事件、处理时限和材料引用；不能把 dispute 当作退款成功。

## 6. 后台工作台与权限

Woo Orders/Customers 是日常入口，HPOS 为订单存储；扩展只通过 CRUD，不写 posts/postmeta 假设。客服、履约、财务与系统管理员需配置不同角色；Woo 默认 Shop Manager 权限较大，不能直接声称已细分。

需要记录操作者、对象、动作、时间、原因和结果。日志不保存完整地址、Cookie、原始 webhook、密钥或银行卡数据。异常工作列表至少覆盖付款待核对、邮件发送失败、缺货、待发货、退款失败和临近处理期限的争议。

生产采用管理员 MFA、最小权限与受控后台访问；webhook 路径需要可公开验签访问，不能被后台登录墙拦截。

## 7. 部署与运营

Local / Staging / Production 使用不同数据库、凭据、插件配置、邮件服务和 PayPal 应用。预发布仅 Sandbox；正式使用独立 Live 接入。禁用不受控自动升级，在预发布验证固定组合后发布。

生产计划：HTTPS，数据库仅本机/私网监听，动态购物车/结账/账户/API 不缓存；Cookie Secure/HttpOnly/SameSite 策略需跨域测试。真实定时任务驱动 WP Cron / Action Scheduler，并监控积压、webhook 失败和邮件队列。发布回滚回滚代码；发生新订单后禁止简单还原旧数据库覆盖交易。

备份包含数据库、上传、发布版本和受保护的配置；加密离机备份，定期恢复演练。RPO/RTO 目标需由成本与业务确认，当前不声明已有保障。

只读服务器检查发现已有 MySQL、Redis、多个 Web 监听端口和约 1.7GiB 可用内存。不能以“只有默认 Nginx 页面”为由把机器当作空机。正式部署前需要核对已有站点及数据库用途、容量、安全组和备份。此次未更改远程服务。

## 8. 参考依据

- [Woo Store API](https://developer.woocommerce.com/docs/apis/store-api/)：购物车、运费与结账接口，公共接口不暴露其他客户信息。
- [Woo Checkout API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/checkout/)：Nonce/Cart Token、草稿订单和付款处理。
- [PayPal Payments 官方集成](https://woocommerce.com/document/woocommerce-paypal-payments/paypal-payments-startup-guide/)：Sandbox/Live 连接与安装要求。
- [PayPal Checkout Blocks 支持边界](https://woocommerce.com/document/woocommerce-paypal-payments/woocommerce-blocks/)：支持的付款体验与未支持能力。
- [退款与 capture](https://woocommerce.com/document/woocommerce-paypal-payments/managing-orders-and-refunds/)：授权、收款、部分退款、全额退款。
- [Woo HPOS recipe book](https://developer.woocommerce.com/docs/features/high-performance-order-storage/recipe-book/)：CRUD 与 HPOS 兼容规则。
- [PayPal Webhooks](https://developer.paypal.com/api/rest/webhooks/rest/)：HTTPS 443、验签、重试与真实 Sandbox 事件。
- [PayPal Idempotency](https://developer.paypal.com/api/rest/reference/idempotency/)：幂等请求行为与限制。

采用成熟平台官方机制作为设计依据；不宣称已复刻或验证任何第三方商户的内部系统。
