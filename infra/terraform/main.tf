provider "aws" {
  region = var.region
  default_tags {
    tags = local.common_tags
  }
}

locals {
  common_tags = merge({
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
  }, var.tags)

  cluster_name = "${var.project}-${var.environment}"
}

# ───────── VPC ─────────
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = var.enable_nat_gateway
  environment        = var.environment
  project            = var.project
}

# ───────── EKS ─────────
module "eks" {
  source = "./modules/eks"

  cluster_name       = local.cluster_name
  cluster_version    = var.eks_version
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_pools         = var.eks_node_pools
  environment        = var.environment
  project            = var.project
}

# ───────── RDS PostgreSQL ─────────
module "rds" {
  source = "./modules/rds"

  identifier                 = "${var.project}-${var.environment}-postgres"
  instance_class             = var.rds_instance_class
  allocated_storage          = var.rds_allocated_storage
  vpc_id                     = module.vpc.vpc_id
  subnet_ids                 = module.vpc.database_subnet_ids
  username                   = var.rds_username
  allowed_security_group_ids = [module.eks.cluster_security_group_id]
  environment                = var.environment
  project                    = var.project
}

# ───────── ElastiCache Redis ─────────
module "redis" {
  source = "./modules/elasticache"

  cluster_id                 = "${var.project}-${var.environment}-redis"
  node_type                  = var.redis_node_type
  num_cache_nodes            = var.redis_num_cache_nodes
  vpc_id                     = module.vpc.vpc_id
  subnet_ids                 = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.eks.cluster_security_group_id]
  environment                = var.environment
  project                    = var.project
}

# ───────── SQS click-events FIFO queue ─────────
module "sqs" {
  source = "./modules/sqs"

  queue_name          = "${var.project}-click-events.fifo"
  visibility_timeout  = var.sqs_click_events_visibility_timeout
  fifo                = true
  content_based_dedup = true
  environment         = var.environment
  project             = var.project
}

# ───────── ECR repositories ─────────
module "ecr" {
  source = "./modules/ecr"

  repository_names = ["url-service", "analytics-service", "user-service", "api-gateway", "frontend"]
  environment      = var.environment
  project          = var.project
}

# ───────── IAM roles for in-cluster services (IRSA) ─────────
module "iam" {
  source = "./modules/iam"

  cluster_name      = local.cluster_name
  sqs_queue_arn     = module.sqs.queue_arn
  oidc_provider_arn = module.eks.oidc_provider_arn
  environment       = var.environment
  project           = var.project
}