include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../../modules/static-site"
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

inputs = {
  bucket_name = local.env.locals.bucket_name
  project     = local.env.locals.project
  web_acl_id  = "arn:aws:wafv2:us-east-1:433314051398:global/webacl/CreatedByCloudFront-af9ccff0/58b85c12-47ea-41b0-a586-712f35b0edc3"
}
