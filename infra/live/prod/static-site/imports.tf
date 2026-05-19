# Run these imports once to bring existing AWS resources under Terraform management.
# Delete this file after a successful `terragrunt apply`.
#
# Find your CloudFront distribution ID:
#   AWS Console → CloudFront → Distributions → ID column (format: E1ABC2DEF3GHI)
#   Or check your GitHub secret: AWS_CLOUDFRONT_DISTRIBUTION_ID
#
# Replace E2TZVJK8GGQCOT before running.

import {
  to = aws_s3_bucket.this
  id = "chairfly"
}

import {
  to = aws_cloudfront_distribution.this
  id = "E2TZVJK8GGQCOT"
}

# aws_cloudfront_origin_access_control is a NEW resource — no import needed, Terraform creates it.
# aws_s3_bucket_public_access_block and aws_s3_bucket_policy will be created/updated by Terraform.
