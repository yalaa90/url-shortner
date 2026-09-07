resource "aws_sqs_queue" "this" {
  name                        = var.queue_name
  fifo_queue                  = var.fifo
  content_based_deduplication = var.fifo ? var.content_based_dedup : null
  visibility_timeout_seconds  = var.visibility_timeout
  message_retention_seconds   = 86400
  receive_wait_time_seconds   = 20
  delay_seconds               = 0

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 5
  })

  tags = {
    Name = var.queue_name
  }
}

resource "aws_sqs_queue" "dlq" {
  name                      = "${var.queue_name}-dlq"
  fifo_queue                = var.fifo
  message_retention_seconds = 1209600

  tags = {
    Name = "${var.queue_name}-dlq"
  }
}

data "aws_iam_policy_document" "queue_policy" {
  policy_id = "${var.queue_name}-policy"

  statement {
    sid    = "AllowSQSFromIRSA"
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
    ]
    resources = [aws_sqs_queue.this.arn, aws_sqs_queue.dlq.arn]
  }
}