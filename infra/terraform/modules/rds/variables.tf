variable "identifier" {
  type = string
}

variable "instance_class" {
  type = string
}

variable "allocated_storage" {
  type = number
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "username" {
  type = string
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