# URL Shortener — Production Platform

A production-grade, horizontally-scalable URL shortener built with Spring Boot microservices and an Angular SPA, deployed to AWS EKS via GitOps (Terraform-cluadformation + Helm + ArgoCD) with full observability.

## Architecture

```
Browser ──► Shell (Angular 17 MFE host + nginx)   localhost:4200
              │  /api/*
              ▼
         API Gateway (Spring Cloud Gateway)  localhost
        ┌──────┬──────────────┬──────────────┐
        ▼      ▼              ▼              ▼
  user-service  url-service   analytics-service
  (auth/JWT)    (core kafka + batch)         (SQS consumer  + PostgreSQL rollups)
        │      │   │                  ▲
       RDS   Redis  └── SQS FIFO ──────┘
              (cache)
```

- **url-service** — create/list/deactivate links, Base62 short codes, code-pool pre-generation + Bloom filter, Redis cache, publish click events to SQS.
- **analytics-service** — consumes click events, aggregates click counts by day/shortCode/referrer/country, exposes analytics endpoints.
- **user-service** — registration/login, RS256 JWT issuing + validation, RBAC.
- **api-gateway** — routes `/api/v1/**`, global JWT validation filter, rate limiting, `X-Owner-Id` propagation.
- **frontend** — Angular 17 **micro-frontend workspace** (Module Federation): a `shell` host (layout, auth state, settings, redirect) that lazy-loads `auth`, `links` and `analytics` remotes sharing a common `@shared-lib`. See [url-shortener-ui/README.md](url-shortener-ui/README.md).

## Repository layout

```
url-shortener/
├── shared-lib/              Cross-module library (entities, idempotency, correlation, metrics)
├── url-service/             Core link CRUD + redirect + click publisher
├── analytics-service/       Click ingestion + aggregation
├── user-service/            Auth + users
├── api-gateway/             Spring Cloud Gateway
├── url-shortener-ui/        Angular 17 MFE workspace (shell + auth/links/analytics remotes + shared-lib)
├── k8s/
│   ├── helm-charts/         Per-service Helm charts (+ redis, frontend)
│   └── argocd/              App-of-apps, AppProject, secrets example
├── infra/terraform/         VPC, EKS, RDS, ElastiCache, SQS, ECR, IRSA (modules)
├── k8s/observability/       kube-prometheus-stack, Tempo, ServiceMonitors, alerts, dashboards
├── .github/workflows/       Backend/Frontend CI + Terraform PR plan/apply
├── docker-compose.yml       Full local stack: infra + backend services + 4 frontend MFEs
└── Makefile                 Developer task runner
```


## Test coverage
- backend has 90% coverage
- frontend has logic covrage 
- loadtest for create api it can handle 800 rps so 2 node can handle more than 100 million rps


## Prerequisites

- JDK 21 (`JAVA_HOME` must point at a Java 21 install — the default on the DevBox is Java 25 and will fail Maven builds)
- Node.js 22, npm
- Docker + Docker Compose (for local infra and integration tests)
- Terraform ≥ 1.5, Helm ≥ 3.14, kubectl, argocd CLI (for EKS deploys)

## Local development

```bash
mvn spring-boot:run
npm run start:mfe     # within url-shortener-ui/ — runs all 4 frontend MFEs (see its README)

# using docker 
docker-compose up

#using kubectl
kubctl run 

# using cloudformation

```

> Note: integration tests (`*IT`) require Docker and are excluded by default; run them with `make backend-test-it` (`-Pintegration-tests`).

### Config

Each service reads standard Spring properties (see `application.yml` / `application-prod.yml`). For production, everything is externalized via ConfigMaps/Secrets (see Helm charts). The API gateway is the only public entrypoint; the SPA nginx proxies `/api/` to it.

### Auth header

Requests to protected endpoints carry `X-Owner-Id` (user UUID); the gateway validates JWTs and rewrites this header. Default local UUID placeholder: `00000000-0000-0000-0000-000000000001`.

## Deployment (AWS EKS)

1. Create the state backend, then apply infrastructure:

```bash
terraform -chdir=infra/terraform/state-bootstrap apply
terraform -chdir=infra/terraform init -backend-config=environments/prod/backend.tfvars
terraform -chdir=infra/terraform plan  -var-file=environments/prod/prod.tfvars
terraform -chdir=infra/terraform apply -var-file=environments/prod/prod.tfvars
```

2. Install ArgoCD and the app-of-apps:

```bash
make k8s-bootstrap    # installs ingress-nginx, cert-manager, ArgoCD, image-updater
kubectl apply -f k8s/argocd/namespaces.yaml
kubectl apply -f k8s/argocd/project.yaml
kubectl apply -f k8s/argocd/applications.yaml
```

3. Images are pushed by GitHub Actions (OIDC → ECR); ArgoCD Image Updater rolls out new digests.

## CI/CD

- **Backend CI**: compile + unit tests on PR; Testcontainers integration tests (Docker); on `main` build JVM + Docker images → ECR.
- **Frontend CI**: matrix build of all 5 projects (`shared-lib` + 4 MFEs); on `main` build & push one Docker image per MFE → ECR (`url-shortener/frontend-<mfe>`).
- **Terraform**: `terraform plan` reported as a PR comment; auto-`apply` on `main`.

## Observability

- **Metrics**: Prometheus scrapes each service via ServiceMonitors (`/actuator/prometheus`), Alertmanager with Slack routing.
- **Dashboards**: Grafana dashboards "URL Shortener Overview" and "Traces" (Tempo) are provisioned via the Grafana sidecar ConfigMap under `k8s/observability/grafana/dashboards/`.
- **Tracing**: Tempo with OTLP receivers; connect via the `Tempo` datasource in Grafana.
- **Alerting**: `k8s/observability/alerting-rules.yaml` — service down, >5% 5xx, p95 > 1.5s, HPA pegged at max, JVM heap > 85%.

## Deploying with CloudFormation

An alternative IaC path (native CloudFormation nested stacks, same footprint as the Terraform stack) lives under `infra/cloudformation/`:

```bash
# deploy (packages the relative TemplateURLs of the nested stacks):
aws cloudformation deploy \
  --template-file infra/cloudformation/main.yaml \
  --stack-name url-shortener-prod \
  --parameter-overrides Environment=prod RdsMasterPassword=<strong-password> \
  --s3-bucket <cfn-artifacts-bucket> --s3-prefix cloudformation \
  --capabilities CAPABILITY_NAMED_IAM

# dev preset (smaller node pools, single cache node) - values in infra/cloudformation/dev-params.json
# RdsMasterPassword is intentionally NOT checked in; supply it at deploy time:
aws cloudformation deploy \
  --template-file infra/cloudformation/main.yaml \
  --stack-name url-shortener-dev \
  --parameter-overrides Environment=dev,RdsMasterPassword=<strong-password> \
  --s3-bucket <cfn-artifacts-bucket> --s3-prefix cloudformation \
  --capabilities CAPABILITY_NAMED_IAM
# To use the dev sizing defaults instead of the prod ones, merge dev-params.json into
# --parameter-overrides (file:// form) after adding RdsMasterPassword to it.
```

- Nested stacks: `network`, `eks` (cluster + node groups + add-ons + OIDC provider), `rds`, `elasticache`, `sqs`, `ecr`, `iam` (IRSA roles).
- Stack `Outputs` mirror the Terraform outputs (cluster endpoint, RDS host + secret ARN, Redis host, SQS URL/ARN, ECR URIs, IRSA role ARNs) so Helm/ArgoCD values stay compatible.
- IRSA ServiceAccounts are emitted in `infra/cloudformation/serviceaccounts.yaml`; substitute `<ACCOUNT_ID>`/`<ENVIRONMENT>` (or copy the role ARNs from the `IrsaRoles` output) before `kubectl apply`.
- The EKS OIDC provider requires a TLS thumbprint (`OidcThumbprint1`, defaulted per region) — derive it with: `echo | openssl s_client -connect oidc.eks.<region>.amazonaws.com:443 2>/dev/null | openssl x509 -fingerprint -noout | cut -d= -f2`.
- Validate locally: `cfn-lint infra/cloudformation/**/*.yaml` (0 errors expected).

## API surface (via gateway, `/api/v1`)

| Method | Path                         | Service           | Notes                          |
|--------|------------------------------|-------------------|--------------------------------|
| POST   | `/auth/register`             | user-service      | create account                 |
| POST   | `/auth/login`                | user-service      | JWT in response                |
| GET    | `/links`                     | url-service       | list (cursor/page paging)      |
| POST   | `/links`                     | url-service       | shorten (custom alias allowed) |
| GET    | `/links/{code}`              | url-service       | public, used for redirect      |
| PATCH  | `/links/{code}/deactivate`   | url-service       | owner-only                     |
| GET    | `/analytics/links/{code}/clicks` | analytics-service | click stats                 |

## Swagger / API docs

Every service exposes springdoc OpenAPI 3 (`/v3/api-docs` JSON + `/swagger-ui.html`). On the gateway these paths are on the public allowlist, so no auth token is required to browse them.

**Production (via api-gateway):**
- Swagger UI: `https://url-shortner/swagger-ui.html`
- OpenAPI: `https://url-shortner/v3/api-docs` and `https://url-shortner/v3/api-docs/gateway`

**Local dev:**
| Service        | Swagger UI                              | OpenAPI JSON                          |
|----------------|-----------------------------------------|---------------------------------------|
| api-gateway    | `http://localhost:8080/swagger-ui.html` | `http://localhost:8080/v3/api-docs`    |
| url-service    | `http://localhost:8081/swagger-ui.html` | `http://localhost:8081/v3/api-docs`    |
| analytics-service | `http://localhost:8082/swagger-ui.html` | `http://localhost:8082/v3/api-docs` |
| user-service   | `http://localhost:8083/swagger-ui.html` | `http://localhost:8083/v3/api-docs`    |

> The gateway's Swagger UI aggregates only gateway-level docs (`/v3/api-docs/gateway`); the per-service APIs are browsed against each service locally, since in production the services are ClusterIP-only and not routed through the gateway.



