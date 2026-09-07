variable "queue_name" {
  type = string
}

variable "visibility_timeout" {
  type    = number
  default = 30
}

variable "fifo" {
  type    = bool
  default = false
}

variable "content_based_dedup" {
  type    = bool
  default = false
}

variable "environment" {
  type = string
}

variable "project" {
  type = string
}