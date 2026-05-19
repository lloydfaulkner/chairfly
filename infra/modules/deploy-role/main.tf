# Register GitHub Actions as a trusted identity provider in this AWS account.
# This is account-level (one per account), so it's safe to re-apply if it already exists.
resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]

  # Thumbprints for GitHub's OIDC intermediate CAs.
  # AWS independently validates GitHub tokens, so these are a formality,
  # but the field is required by the API.
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}

resource "aws_iam_role" "deploy" {
  name = "chairfly-github-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github_actions.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          # Scoped to main branch only — other branches cannot assume this role
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })
}

resource "aws_iam_policy" "s3_deploy" {
  name        = "chairfly-s3-deploy"
  description = "Allows GitHub Actions to sync files to the chairfly S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:DeleteObject"]
      Resource = "arn:aws:s3:::${var.bucket_name}/*"
    }]
  })
}

resource "aws_iam_policy" "cloudfront_invalidate" {
  name        = "chairfly-cloudfront-invalidate"
  description = "Allows GitHub Actions to invalidate the chairfly CloudFront distribution"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["cloudfront:CreateInvalidation"]
      Resource = var.cloudfront_distribution_arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "s3_deploy" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.s3_deploy.arn
}

resource "aws_iam_role_policy_attachment" "cloudfront_invalidate" {
  role       = aws_iam_role.deploy.name
  policy_arn = aws_iam_policy.cloudfront_invalidate.arn
}
