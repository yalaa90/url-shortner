locals {
  sqs_actions = [
    "sqs:SendMessage",
    "sqs:ReceiveMessage",
    "sqs:DeleteMessage",
    "sqs:GetQueueAttributes",
    "sqs:GetQueueUrl",
  ]
}

resource "aws_iam_role" "sqs_publisher" {
  name = "${var.cluster_name}-url-service-sqs-publisher"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Condition = {
        StringEquals = {
          "sts.amazonaws.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "sts.amazonaws.com:sub" = "system:serviceaccount:url-shortener:url-service"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "sqs_publisher" {
  name = "sqs-click-events-publish"
  role = aws_iam_role.sqs_publisher.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = local.sqs_actions
      Resource = [var.sqs_queue_arn, "${var.sqs_queue_arn}-dlq"]
    }]
  })
}

resource "aws_iam_role" "sqs_consumer" {
  name = "${var.cluster_name}-analytics-service-sqs-consumer"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Condition = {
        StringEquals = {
          "sts.amazonaws.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "sts.amazonaws.com:sub" = "system:serviceaccount:url-shortener:analytics-service"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "sqs_consumer" {
  name = "sqs-click-events-consume"
  role = aws_iam_role.sqs_consumer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = local.sqs_actions
      Resource = [var.sqs_queue_arn, "${var.sqs_queue_arn}-dlq"]
    }]
  })
}

resource "aws_iam_role" "secrets_reader" {
  name = "${var.cluster_name}-secrets-reader"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Condition = {
        StringEquals = {
          "sts.amazonaws.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "sts.amazonaws.com:sub" = "system:serviceaccount:url-shortener:*"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "secrets_reader" {
  name = "read-app-secrets"
  role = aws_iam_role.secrets_reader.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = ["*"]
    }]
  })
}