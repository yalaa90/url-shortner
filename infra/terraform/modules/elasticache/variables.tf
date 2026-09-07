variable "cluster_id" {
  type = string
}

variable "node_type" {
  type = string
}

variable "num_cache_nodes" {
  type    = number
  default = 1
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "allowed_security_group_ids" {
  type    = list(string)
  default = []
}

variable "environment" {
  type = string
}

variable "project" {
  type = string
}