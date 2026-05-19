output "deploy_role_arn" {
  value       = aws_iam_role.deploy.arn
  description = "ARN to set as AWS_DEPLOY_ROLE_ARN in GitHub Secrets"
}
