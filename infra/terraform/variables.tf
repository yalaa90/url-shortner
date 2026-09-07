variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name used for resource tagging"
  type        = string
  default     = "url-shortener"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for the VPC"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT gateways for private subnets"
  type        = bool
  default     = true
}

variable "eks_version" {
  description = "Kubernetes version for the EKS control plane"
  type        = string
  default     = "1.30"
}

variable "eks_node_pools" {
  description = "EKS managed node group configuration"
  type = map(object({
    instance_types = list(string)
    desired_size   = number
    min_size       = number
    max_size       = number
    capacity_type  = string
    disk_size      = number
  }))
  default = {
    general = {
      instance_types = ["m5.large"]
      desired_size   = 3
      min_size       = 3
      max_size       = 10
      capacity_type  = "ON_DEMAND"
      disk_size      = 100
    }
  }
}

variable "rds_instance_class" {
  description = "RDS PostgreSQL instance class"
  type        = string
  default     = "db.t4g.small"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_username" {
  description = "RDS master username"
  type        = string
  default     = "urlshortener"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of ElastiCache Redis nodes"
  type        = number
  default     = 1
}

variable "sqs_click_events_visibility_timeout" {
  description = "Visibility timeout seconds for the click-events FIFO queue"
  type        = number
  default     = 60
}

variable "ecr_image_tags" {
  description = "Map of service to image tag (managed by CI)"
  type        = map(string)
  default = {
    url-service       = "latest"
    analytics-service = "latest"
    user-service      = "latest"
    api-gateway       = "latest"
    frontend          = "latest"
  }
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}