environment = "prod"
region      = "us-east-1"

availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

eks_version = "1.30"

eks_node_pools = {
  general = {
    instance_types = ["m5.large"]
    desired_size   = 3
    min_size       = 3
    max_size       = 12
    capacity_type  = "ON_DEMAND"
    disk_size      = 100
  }
  spot = {
    instance_types = ["m5.large"]
    desired_size   = 0
    min_size       = 0
    max_size       = 10
    capacity_type  = "SPOT"
    disk_size      = 100
  }
}

rds_instance_class    = "db.r6g.large"
rds_allocated_storage = 50

redis_node_type       = "cache.t4g.micro"
redis_num_cache_nodes = 2

sqs_click_events_visibility_timeout = 60

tags = {
  Team        = "platform"
  CostCenter  = "url-shortener"
  Environment = "prod"
}