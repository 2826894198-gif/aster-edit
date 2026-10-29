# 本地启动与独立配置

以下命令都从合仓后的根目录执行。前端与交易服务可以分别运行；不要求为了浏览商品页面启动商户环境。

## 前端预览

需要 Node.js 22+。

```sh
npm --prefix apps/storefront ci
npm --prefix apps/storefront run dev
```

也可使用 `make storefront-install`、`make storefront-dev`。前端环境示例位于 `apps/storefront/.env.example`，默认不配置真实商户 origin。不要在根目录创建共享商户环境文件。

```sh
npm --prefix apps/storefront run build
npm --prefix apps/storefront run test:sites
```

构建输出位于 `apps/storefront/dist/`。保留的公开图片 manifest/衍生素材已用于演示；`images:prepare` 是素材维护命令，不应在缺少私有原图时重建并覆盖 manifest。

## production metadata 检查

普通预览是 noindex。若核对生产 SEO 的静态元数据期待，运行：

```sh
make storefront-seo-check
```

该命令在 `apps/storefront/` 内设置 `PUBLICATION_MODE=production` 和 `VITE_PUBLICATION_MODE=production`，并明确保持 `VITE_ASTER_COMMERCE_ORIGIN` 为空。它不部署、不启用真实结账。批准快照的定向结果为 8/9，杯页旧锚点断言仍未通过，见 [已知问题](KNOWN_ISSUES.md)。

## 本地交易服务

需要 Node.js 与 Docker Desktop。准备独立合成数据环境后才运行：

```sh
make commerce-bootstrap
make commerce-verify
make commerce-stop
```

等价于进入 `services/commerce/` 后执行原有 `scripts/bootstrap-local.sh`、`scripts/verify-local.sh` 和 `docker compose stop`。初始化脚本只为该服务生成本地随机密钥；`.secrets/`、`.runtime/` 和数据库数据均留在该模块的本地环境中，不提交 Git。

本地网页使用 `127.0.0.1:8088`，Mailpit 使用 `127.0.0.1:8028`。原有 Compose 项目名与端口保留；启动前确认没有同名本地实例或端口占用。本次合仓没有启动、停止或迁移任何现存容器。

`docker compose stop` 保留数据。不要把清卷、真实商户接入、生产迁移、外部邮件或支付操作当作普通启动步骤。公开商品与合成订单只用于演示，不证明真实付款验收。

## 独立部署

前端静态产物与 PHP/WordPress 服务仍各自构建和部署。可选托管平台的私有配置不在仓库；缺少该配置时前端普通静态构建只跳过平台打包。仓库合并本身不授权任何远端发布。
