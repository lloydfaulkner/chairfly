variable "bucket_name" {
  type        = string
  description = "S3 bucket name for the static site"
}

variable "project" {
  type        = string
  description = "Project name, used for resource naming"
}

variable "web_acl_id" {
  type        = string
  default     = null
  description = "ARN of a WAF Web ACL to attach to the CloudFront distribution. Null disables WAF."
}
