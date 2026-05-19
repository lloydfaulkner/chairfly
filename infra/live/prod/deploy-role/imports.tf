# Run these imports once, then delete this file after a successful `terragrunt apply`.
#
# All resources here are NEW (OIDC provider, role, role attachments) — no imports needed for those.
#
# The two IAM policies may already exist from the manual AWS setup.
# Check: AWS Console → IAM → Policies → filter "chairfly"
#
# If chairfly-s3-deploy and chairfly-cloudfront-invalidate exist:
#   - Fill in ACCOUNT_ID_HERE and uncomment the import blocks below
# If they don't exist (different names, or none):
#   - Delete the old ones from the console, leave imports commented out,
#     and Terraform will create fresh policies with the correct names
#
# Also: delete the old chairfly-deploy IAM user from the console AFTER
# deploy.yml is updated and a successful deploy confirms OIDC is working.

# import {
#   to = aws_iam_policy.s3_deploy
#   id = "arn:aws:iam::ACCOUNT_ID_HERE:policy/chairfly-s3-deploy"
# }

# import {
#   to = aws_iam_policy.cloudfront_invalidate
#   id = "arn:aws:iam::ACCOUNT_ID_HERE:policy/chairfly-cloudfront-invalidate"
# }
