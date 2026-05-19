include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "static_site" {
  config_path = "../static-site"
}

terraform {
  source = "../../../modules/deploy-role"
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

inputs = {
  bucket_name                 = local.env.locals.bucket_name
  cloudfront_distribution_arn = dependency.static_site.outputs.cloudfront_distribution_arn
  github_repo                 = "lloydfaulkner/chairfly"
}
