# URL Shortener UI — Micro-Frontend Architecture

Angular 17 workspace broken into **4 micro-frontends (MFEs)** built with
[Module Federation](https://github.com/angular-architects/module-federation-plugin)
(`@angular-architects/module-federation` + the `ngx-build-plus` webpack builder), plus a shared
library. The host (**shell**) loads the other MFEs as lazy route chunks from their own servers.

## Architecture

```
                              ┌───────────────────────────────┐
                              │          shell (host)         │  :4200
                              │  layout · auth NgRx state     │
                              │  interceptors · settings      │
                              │  redirect page · routing      │
                              └──────────────┬────────────────┘
                loadRemoteModule (./routes)  │  HTTP
 ┌──────────────────────────┬────────────────┴──────────────┬──────────────────────────┐
 │                          │                                 │                          │
 ▼                          ▼                                 ▼                          ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────────────┐  ┌────────────────────┐
│  shared-lib   │  │   auth-remote    │  │     links-remote     │  │  analytics-remote  │
│  (library)    │  │      :4201       │  │        :4202         │  │       :4203        │
│ models/comp/  │  │  login/register  │  │ dashboard · links    │  │ charts & referrer  │
│ validators/   │  └──────────────────┘  │ list/create/detail   │  └────────────────────┘
│ pipes/direct~ │                        │ NgRx `links` slice   │
└───────────────┘                        └──────────────────────┘
```

All apps import from the shared library through the `@shared-lib` TypeScript path alias
(defined in `tsconfig.base.json`).

## Repository layout

```
url-shortener-ui/
├── angular.json                 # 5-project workspace definition
├── tsconfig.base.json           # compiler options + @shared-lib path aliases
├── package.json                 # scripts, module-federation deps, ngx-charts postinstall
├── Dockerfile                   # builds the shell (host) image
├── Dockerfile.mfe               # parameterized build for any MFE (ARG MFE_NAME)
├── nginx-shell.conf             # host nginx: /api/ + /remote/<mfe>/ proxying
├── nginx-remote.conf            # remote nginx (static SPA + /healthz)
├── .dockerignore
└── projects/
    ├── shared-lib/              # 📦 shared models, components, validators, pipes, directives
    ├── shell/                   # 🚀 host application
    ├── auth-remote/             # 🔐 login + register
    ├── links-remote/            # 🔗 dashboard + link management + NgRx links state
    └── analytics-remote/        # 📊 analytics charts + referrer tables
```

## Micro-frontends

| MFE | Port | Owns | Exposes to the host |
|-----|------|------|---------------------|
| `shell` | 4200 | Layout, auth guard + NgRx `auth` slice, HTTP interceptors, settings & redirect pages, route orchestration via `loadRemoteModule` | — |
| `auth-remote` | 4201 | Login / register pages plus self-contained copies of auth services, guards & interceptors so it can run standalone | `./authRoutes` |
| `links-remote` | 4202 | Dashboard and link management (list / create / detail) with its own NgRx `links` slice | `./routes` (`dashboardRoutes`, `linkManagementRoutes`) |
| `analytics-remote` | 4203 | Click charts (ngx-charts) and referrer tables | `./analyticsRoutes` |
| `shared-lib` | — | Models, 6 components, 3 validators, 3 pipes, 2 directives | n/a (npm library via `@shared-lib`) |

Remote federation config lives in each app's `webpack.config.js` and highlights *which routes
module* the host consumes:

- `auth-remote`: exposes `./authRoutes` → `projects/auth-remote/src/app/app.routes.ts`
- `links-remote`: exposes `./routes` → `projects/links-remote/src/app/app.routes.ts`
- `analytics-remote`: exposes `./analyticsRoutes` → `projects/analytics-remote/src/app/app.routes.ts`

## Key design decisions

- **Remotes expose route modules, not components.** The host's `app.routes.ts` calls
  `loadRemoteModule({ type: 'module', remoteEntry, exposedModule })` and plugs the returned
  route arrays into its own router under `/auth`, `/dashboard`, `/links` and `/analytics/:code`.
- **Shared singletons.** `shareAll` shares `@angular/*`, `@ngrx/*`, `rxjs`, `@swimlane/ngx-charts`
  and other runtime deps as singletons between the bundles. `@shared-lib` is a library and is
  bundled into each app.
- **NgRx across the federation boundary.**
  - The **shell** registers the global `auth` slice (`provideState('auth', authReducer)`) once at boot.
  - The **links-remote** registers its `links` slice **lazily on the route providers**
    (`providers: [provideState('links', linkReducer), provideEffects([LinkEffects])]`)
    so the store registers/unregisters as you navigate into the federated routes — both inside
    the host and when the remote runs standalone.
  - The **analytics-remote** needs no store — it uses component-local observables + a service.
- **Environment-driven remote URLs.** `projects/shell/src/environments/*` keep the remote entry
  addresses; production swaps via `fileReplacements`:
  - dev: `http://localhost:4201|4202|4203/remoteEntry.js`
  - prod: `/remote/{auth,links,analytics}/remoteEntry.js` (served through the host nginx)

## Development

```bash
npm install          # postinstall patches @swimlane/ngx-charts deep imports
```

Run all four apps together (HMR per app):

```bash
npm run start:mfe    # shell(:4200) auth(:4201) links(:4202) analytics(:4203)
```

Or individually while iterating on one MFE:

```bash
npm run start:shell
npm run start:auth
npm run start:links
npm run start:analytics
```

Each remote is a fully bootstrapped app on its own port, so you can develop it in isolation.
Open `http://localhost:4200` — the shell lazy-loads the remotes on demand.

## Build

```bash
npm run build:all    # shared-lib, then all four MFEs (production)
```

Individual production builds:

```bash
npm run build:shared
npm run build:shell
npm run build:auth
npm run build:links
npm run build:analytics
```

Artifacts land in `dist/<app>/`. Run unit tests with `ng test` (per-app Karma config).

## Deployment

### Docker

`Dockerfile.mfe` is a multi-stage, parameterized build — one image per MFE:

```bash
# e.g. build the links remote
docker build -f Dockerfile.mfe --build-arg MFE_NAME=links-remote -t url-shortener-links .
```

`docker-compose.yml` at the repo root starts the whole stack (backends + databases + gateways)
plus the four frontends:

| Service | Host port |
|---------|-----------|
| `shell-frontend` | 4200 |
| `auth-frontend`  | 4201 |
| `links-frontend` | 4202 |
| `analytics-frontend` | 4203 |

The **shell** nginx (`nginx-shell.conf`) is the entry point and routes:

- `/remote/<mfe>/…` → the matching MFE container (module-federation `remoteEntry.js` + lazy chunks)
- `/api/…` → the API gateway container

These locations use `^~` so they take precedence over the static-asset regex location for `*.js`.

### CI/CD

`.github/workflows/frontend-ci.yml`:

1. **build job** — matrix over `[shared-lib, auth-remote, links-remote, analytics-remote, shell]`:
   `npm ci`, build project, upload `dist/<app>` artifacts.
2. **publish job** (on `main`) — builds & pushes `url-shortener/frontend-<mfe>` images to ECR.

### Kubernetes / Helm

The `k8s/helm-charts/frontend` chart is deployed once per MFE with a values file:

- `values-shell.yaml`
- `values-auth-remote.yaml`
- `values-links-remote.yaml`
- `values-analytics-remote.yaml`

Each deployment serves the MFE on the standard container port; only the shell exposes ingress.

## Ports summary

| App | Dev | Docker |
|-----|-----|--------|
| shell | 4200 | 4200 → 8080 |
| auth-remote | 4201 | 4201 → 8080 |
| links-remote | 4202 | 4202 → 8080 |
| analytics-remote | 4203 | 4203 → 8080 |