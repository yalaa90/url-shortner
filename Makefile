SHELL := /bin/bash
.DEFAULT_GOAL := help

JAVA_HOME ?= /usr/lib/jvm/java-21-openjdk-amd64
export JAVA_HOME
MVN := mvn

HELM ?= helm
TERRAFORM ?= terraform
PWD := $(shell pwd)

.PHONY: help infra-up infra-down backend-build backend-test backend-test-it \
        frontend-install frontend-build frontend-serve backend-run \
        run-gateway run-url-service run-analytics run-user-service \
        helm-lint helm-template k8s-bootstrap terraform-init terraform-plan terraform-apply \
        check clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

infra-up: ## Start local infra (PostgreSQL, Redis, LocalStack, ClickHouse)
	docker compose up -d --wait

infra-down: ## Stop local infra
	docker compose down

backend-build: ## Compile all Maven modules (shared-lib + services)
	$(MVN) -B -ntp clean install -DskipTests -pl url-service,api-gateway,analytics-service,user-service -am

backend-test: ## Run unit tests across modules
	$(MVN) -B -ntp verify -DskipITs

backend-test-it: ## Run integration tests (Testcontainers, requires Docker)
	$(MVN) -B -ntp verify -Pintegration-tests

run-gateway: ## Run api-gateway locally
	$(MVN) -B -ntp spring-boot:run -pl api-gateway

run-url-service: ## Run url-service locally
	$(MVN) -B -ntp spring-boot:run -pl url-service

run-analytics-service: ## Run analytics-service locally
	$(MVN) -B -ntp spring-boot:run -pl analytics-service

run-user-service: ## Run user-service locally
	$(MVN) -B -ntp spring-boot:run -pl user-service

frontend-install: ## Install frontend dependencies
	cd url-shortener-ui && npm ci

frontend-build: ## Build the Angular SPA (production)
	cd url-shortener-ui && npm run build

frontend-serve: ## Run the Angular dev server
	cd url-shortener-ui && npm start

helm-lint: ## Lint all Helm charts
	for c in k8s/helm-charts/*/; do $(HELM) lint "$$c"; done

helm-template: ## Render sample manifests for all charts
	for c in k8s/helm-charts/*/; do $(HELM) template "rel-$$(basename $$c)" "$$c" >/dev/null; done

k8s-bootstrap: ## Install cluster prerequisites (as applied by GitOps)
	$(HELM) repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
	$(HELM) repo add jetstack https://charts.jetstack.io
	$(HELM) repo add argo https://argoproj.github.io/argo-helm
	$(HELM) upgrade --install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
	$(HELM) upgrade --install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace \
	  --set installCRDs=true
	$(HELM) upgrade --install argocd argo/argo-cd --namespace argocd --create-namespace --wait

terraform-init: ## Init Terraform with prod backend
	cd $(PWD)/infra/terraform && $(TERRAFORM) init -backend-config=environments/prod/backend.tfvars

terraform-plan: terraform-init ## Terraform plan (prod)
	cd $(PWD)/infra/terraform && $(TERRAFORM) plan -var-file=environments/prod/prod.tfvars -out=tfplan

terraform-apply: ## Terraform apply (prod)
	cd $(PWD)/infra/terraform && $(TERRAFORM) apply -var-file=environments/prod/prod.tfvars

check: backend-test frontend-build helm-lint ## Full local verification
	@echo "All checks passed."

clean: ## Clean build artifacts
	$(MVN) -B -ntp clean -pl url-service,api-gateway,analytics-service,user-service -am
	cd url-shortener-ui && rm -rf node_modules dist