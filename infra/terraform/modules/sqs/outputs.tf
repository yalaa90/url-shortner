output "queue_url" {
  value = aws_sqs_queue.this.url
}

output "queue_arn" {
  value = aws_sqs_queue.this.arn
}

output "dlq_arn" {
  value = aws_sqs_queue.dlq.arn
}

output "policy_document" {
  value = data.aws_iam_policy_document.queue_policy.json
}

output "policy_summary" {
  value = data.aws_iam_policy_document.queue_policy.statement[*].actions
}