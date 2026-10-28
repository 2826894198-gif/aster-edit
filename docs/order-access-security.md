# 客户记录和游客查单 v1

## 记录归属

Woo / WordPress 是唯一客户账户库，Woo HPOS 是唯一订单库。游客资料保存在订单快照，不因输入邮箱就创建账户、订阅营销或认领历史订单。使用已安装 Woo 11.1.1 的 EmailVerificationService / VerificationController 验证账户邮箱后关联游客历史订单，不增加无验证的捷径。

查单授权仅属于单订单，不登录账户、不修改付款状态。官方 PayPal 插件仍是唯一支付写入方；查单模块不处理银行卡或自写 capture/refund。

## 已实现接口

路径前缀为 `/wp-json/aster/v1`。POST 要求后端自身 Origin、application/json、正文不超过 2048 字节。当前只支持 Woo 原生数字订单号；如使用第三方编号插件，必须先扩展并测试映射。

1. `POST /order-access-requests`，正文 `{ "order_number": "51", "email": "guest-access@aster.test" }`（仅本地 fixture 示例）。语法正确的匹配、不匹配和被限流申请都返回相同 202 消息。Action Scheduler 任务仅接收订单 ID / 邮箱 HMAC，不记录输入邮箱和 bearer token。
2. 工作器从真实订单取邮箱，发送 `/order-status/#access=<secret>`。256 位随机链接，数据库只存 SHA256，15 分钟有效。打开页面不自动兑换；fragment 立即移除，用户点击 View order 才继续。
3. `POST /order-access/exchange`，正文 `{ "token": "<secret>" }`。数据库原子单次消费；返回 15 分钟 HttpOnly、SameSite=Strict、host-only Cookie。HTTPS 加 Secure，非 local 环境拒绝非 HTTPS 请求。
4. `GET /order-access/order`，只接受 Cookie，不允许查询参数切换订单。返回订单号、时间、Woo 状态、币种、商品行、总额、运费、税及退款总额。金额使用字符串；不返回地址、邮箱、电话、客户 ID、订单密钥、内部备注和支付交易标识。
5. `POST /order-access/logout`，正文 `{}`，撤销服务器会话及 Cookie。账单邮箱变化时删除不匹配的访问凭证；过期凭证每小时清理，但每次访问始终检查期限。

## 限流和隐私

- 数据库原子计数，窗口从首次请求开始：15 分钟内每 IP 20 次申请，每订单/邮箱 3 次，每订单 5 次，每 IP 60 次兑换。受限后不发邮件，申请仍返回同一通用消息。
- 使用 REMOTE_ADDR，不信任任意 X-Forwarded-For。生产反向代理必须可靠还原客户端地址并配置边缘限流，不能直接开放任意转发头。
- 查单 API 禁缓存、不开放跨域读取；页面没有第三方脚本，CSP 禁止 iframe 嵌入，Referrer-Policy=no-referrer。部署时排除 CDN/页面缓存，禁止记录请求体、Cookie、邮件链接。
- 临时表含令牌摘要、邮箱 HMAC、订单 ID、时间和限流摘要；这些仍属于可关联个人数据，不是匿名资料。WordPress 隐私擦除回调可以撤销邮箱对应临时凭证；Woo 原生负责账户/订单隐私政策和导出。
- Action Scheduler 历史记录、邮件服务也有各自保留期限，生产前需统一保留政策。Mailpit 仅保存虚构测试邮件和短效测试秘密，不可用于正式客户邮件。

## 运维与尚未验收的部分

本地靠 Woo Action Scheduler / WP Cron；生产需要可靠 worker/cron、积压和失败告警、退信及重试策略。202 仅表示受理，不承诺邮件送达。SMTP 失败时链接立即撤销，只写无订单/邮箱/令牌的最小错误消息；生产邮件补发工作流未完成。

账户验证为原生服务级测试，不代表浏览器登录、注册、密码恢复全流程验收；游客接口通过真实 HTTP 和本地 SMTP 测试。公网邮件、生产部署、付款对账、退款、物流和客服角色仍未完成。

参考：[WordPress REST 权限回调](https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/)、[隐私擦除钩子](https://developer.wordpress.org/plugins/privacy/adding-the-personal-data-eraser-to-your-plugin/)、[Woo HPOS 适配](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/recipe-book/)。原生账户验证的具体行为以当前安装的 Woo 官方源码及本地测试为准。
