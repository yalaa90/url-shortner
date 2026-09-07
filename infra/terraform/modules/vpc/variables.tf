variable "vpc_cidr" {
  type = string
}

variable "availability_zones" {
  type = list(string)
}

variable "enable_nat_gateway" {
  type    = bool
  default = true
}

variable "environment" {
  type = string
}

variable "project" {
  type = string
}