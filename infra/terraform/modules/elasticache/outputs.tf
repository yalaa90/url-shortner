output "endpoint" {
  value = split(":", aws_elasticache_replication_group.this.primary_endpoint_address)[0]
}

output "port" {
  value = aws_elasticache_replication_group.this.port
}

output "primary_endpoint" {
  value = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "security_group_id" {
  value = aws_security_group.redis.id
}