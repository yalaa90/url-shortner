resource "aws_elasticache_subnet_group" "this" {
  name       = replace(var.cluster_id, "[-._]", "")
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "redis" {
  name        = "${var.cluster_id}-sg"
  description = "Allow access to Redis from EKS nodes"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from EKS cluster"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id       = var.cluster_id
  description                = "URL Shortener Redis cache"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_nodes
  parameter_group_name       = "default.redis7"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.this.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = var.num_cache_nodes > 1
  multi_az_enabled           = var.num_cache_nodes > 1
  snapshot_retention_limit   = 7
  snapshot_window            = "03:30-04:30"
  maintenance_window         = "sun:05:00-sun:06:00"
  auto_minor_version_upgrade = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  tags = {
    Name = var.cluster_id
  }
}