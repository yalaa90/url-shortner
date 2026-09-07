bucket         = "url-shortener-tfstate"
key            = "prod/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "url-shortener-tfstate-lock"
encrypt        = true