# Portal Tela: hospedagem estatica na AWS (S3 privado + CloudFront), com dominio proprio e senha.
# Custo: ~US$ 0 (free tier permanente do CloudFront: 1 TB de saida, 10 mi de requisicoes e 2 mi de
# execucoes de CloudFront Function por mes; certificado ACM e gratis; S3 com poucos MB custa centavos).
# O DNS usa a zona Route53 portaltela.com que ja existe na conta (sem custo extra; so adiciona 2 registros).
#
# Uso (dentro da pasta terraform/, com a conta certa: export AWS_PROFILE=portal-tela):
#   npm run build (na raiz do projeto) && terraform init
#   terraform apply        # cria tudo, inclusive o DNS e o certificado (leva ~5-10 min)
#   Abra https://login-flow-v4.portaltela.com/entrar?demo
#   Usuario: demo | Senha: terraform output -raw senha
#
# Atualizar o site:  npm run build && terraform apply
# Tirar do ar (pausa, mantem a config, custo continua ~0):  terraform apply -var online=false
# Apagar TUDO (bucket, CloudFront, certificado e os 2 registros DNS):  terraform destroy

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

variable "region" {
  type    = string
  default = "us-east-2"
}

variable "domain" {
  type    = string
  default = "login-flow-v4.portaltela.com"
}

variable "zone" {
  description = "Zona Route53 ja existente na conta"
  type        = string
  default     = "portaltela.com"
}

variable "usuario" {
  type    = string
  default = "demo"
}

variable "online" {
  description = "false = tira o site do ar sem apagar nada"
  type        = bool
  default     = true
}

provider "aws" {
  region = var.region
}

# Certificados do CloudFront precisam estar na us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "random_password" "senha" {
  length  = 16
  special = false
}

locals {
  dist_dir = "${path.module}/../dist"

  mime_types = {
    html  = "text/html; charset=utf-8"
    js    = "application/javascript"
    mjs   = "application/javascript"
    css   = "text/css"
    json  = "application/json"
    svg   = "image/svg+xml"
    png   = "image/png"
    jpg   = "image/jpeg"
    jpeg  = "image/jpeg"
    webp  = "image/webp"
    avif  = "image/avif"
    gif   = "image/gif"
    ico   = "image/x-icon"
    woff  = "font/woff"
    woff2 = "font/woff2"
    txt   = "text/plain"
    map   = "application/json"
  }

  files = fileset(local.dist_dir, "**")
}

# --- Bucket privado (so o CloudFront le) ---

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "site" {
  bucket        = "portal-tela-demo-${random_id.suffix.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_object" "files" {
  for_each = local.files

  bucket       = aws_s3_bucket.site.id
  key          = each.value
  source       = "${local.dist_dir}/${each.value}"
  etag         = filemd5("${local.dist_dir}/${each.value}")
  content_type = lookup(local.mime_types, reverse(split(".", each.value))[0], "application/octet-stream")

  # Assets do Vite tem hash no nome (cache longo); o index.html sempre revalida.
  cache_control = startswith(each.value, "assets/") ? "public, max-age=31536000, immutable" : "no-cache"
}

# --- Certificado HTTPS do dominio (gratis) ---

resource "aws_acm_certificate" "site" {
  provider          = aws.us_east_1
  domain_name       = var.domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_route53_zone" "site" {
  name = var.zone
}

# CNAME que prova ao ACM que o dominio e nosso.
resource "aws_route53_record" "validacao" {
  for_each = { for o in aws_acm_certificate.site.domain_validation_options : o.domain_name => o }

  zone_id         = data.aws_route53_zone.site.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for r in aws_route53_record.validacao : r.fqdn]
}

# --- Senha (pop-up de login do navegador, "Basic Auth") ---
# CloudFront Function: roda antes do cache, entao nada e servido sem a senha.

resource "aws_cloudfront_function" "auth" {
  name    = "portal-tela-auth-${random_id.suffix.hex}"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    = <<-JS
    function handler(event) {
      var h = event.request.headers;
      if (h.authorization && h.authorization.value === "Basic ${base64encode("${var.usuario}:${random_password.senha.result}")}") {
        return event.request;
      }
      return {
        statusCode: 401,
        statusDescription: "Unauthorized",
        headers: { "www-authenticate": { value: 'Basic realm="Portal Tela"' } }
      };
    }
  JS
}

# --- CloudFront ---

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "portal-tela-demo-${random_id.suffix.hex}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = var.online
  aliases             = [var.domain]
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # so America do Norte e Europa (a mais barata)
  comment             = "Portal Tela - demo"

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.auth.arn
    }

    # Politica gerenciada "CachingOptimized"
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  # SPA: rotas como /entrar nao existem no S3, entao devolve o index.html (equivale ao rewrite do vercel.json).
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only" # sni-only e gratis (IP dedicado custa US$ 600/mes)
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# login-flow-v4.portaltela.com -> CloudFront (alias: gratis, sem CNAME).
resource "aws_route53_record" "site" {
  zone_id = data.aws_route53_zone.site.zone_id
  name    = var.domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

# Libera o CloudFront (e so essa distribuicao) a ler o bucket.
resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontRead"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.site.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.site.arn }
      }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.site]
}

output "url" {
  value = "https://${var.domain}/entrar?demo"
}

output "usuario" {
  value = var.usuario
}

output "senha" {
  value     = random_password.senha.result
  sensitive = true
}
