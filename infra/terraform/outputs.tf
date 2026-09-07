output "vpc_id" {
  value = module.vpc.vpc_id
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_certificate_authority" {
  value = module.eks.cluster_certificate_authority
}

output "rds_endpoint" {
  value = module.rds.endpoint
}

output "rds_password_secret_arn" {
  value = module.rds.password_secret_arn
}

output "redis_endpoint" {
  value = module.redis.endpoint
}

output "click_events_queue_url" {
  value = module.sqs.queue_url
}

output "click_events_queue_arn" {
  value = module.sqs.queue_arn
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "irsa_roles" {
  value = module.iam.role_arns
}