output "role_arns" {
  value = {
    sqs_publisher  = aws_iam_role.sqs_publisher.arn
    sqs_consumer   = aws_iam_role.sqs_consumer.arn
    secrets_reader = aws_iam_role.secrets_reader.arn
  }
}