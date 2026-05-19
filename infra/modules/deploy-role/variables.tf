variable "bucket_name" {
  type        = string
  description = "S3 bucket name the deploy role needs access to"
}

variable "cloudfront_distribution_arn" {
  type        = string
  description = "ARN of the CloudFront distribution for cache invalidation"
}

variable "github_repo" {
  type        = string
  description = "GitHub repo in owner/name format (e.g. lloydfaulkner/chairfly)"
}
