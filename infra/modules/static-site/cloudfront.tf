locals {
  s3_origin_id = "S3-${var.bucket_name}"

  # AWS-managed CachingOptimized policy ID (consistent across all accounts)
  caching_optimized_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
}

resource "aws_cloudfront_origin_access_control" "this" {
  name                              = "${var.project}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  default_root_object = "index.html"
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  web_acl_id          = var.web_acl_id
  tags                = { Name = var.project }

  origin {
    domain_name              = aws_s3_bucket.this.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = local.caching_optimized_policy_id
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "CA", "PR", "VI", "GU"]
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
