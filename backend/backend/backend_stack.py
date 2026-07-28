from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_s3 as s3,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_codebuild as codebuild,
    RemovalPolicy,
    Duration,
    SecretValue
)
from aws_cdk import aws_amplify_alpha as amplify
from constructs import Construct

class BackendStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        is_prod = self.node.try_get_context("env") == "prod"
        removal_policy = RemovalPolicy.RETAIN if is_prod else RemovalPolicy.DESTROY

        # 1. S3 Bucket for Product Images
        image_bucket = s3.Bucket(
            self, "ProductImageBucket",
            bucket_name="two-souls-product-images",
            removal_policy=removal_policy,
            auto_delete_objects=not is_prod,
            block_public_access=s3.BlockPublicAccess(
                block_public_acls=False,
                block_public_policy=False,
                ignore_public_acls=False,
                restrict_public_buckets=False
            ),
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.PUT, s3.HttpMethods.GET],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                )
            ]
        )

        image_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                actions=["s3:GetObject"],
                resources=[image_bucket.arn_for_objects("*")],
                principals=[iam.AnyPrincipal()]
            )
        )

        # 2. DynamoDB Tables
        sellers_table = dynamodb.Table(
            self, "SellersTable",
            table_name="TwoSoulsSellersTable",
            partition_key=dynamodb.Attribute(name="seller_id", type=dynamodb.AttributeType.STRING),
            removal_policy=removal_policy,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )

        products_table = dynamodb.Table(
            self, "ProductsTable",
            table_name="TwoSoulsProductsTable",
            partition_key=dynamodb.Attribute(name="product_id", type=dynamodb.AttributeType.STRING),
            removal_policy=removal_policy,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )
        products_table.add_global_secondary_index(
            index_name="SellerIndex",
            partition_key=dynamodb.Attribute(name="seller_id", type=dynamodb.AttributeType.STRING)
        )

        orders_table = dynamodb.Table(
            self, "OrdersTable",
            table_name="TwoSoulsOrdersTable",
            partition_key=dynamodb.Attribute(name="order_id", type=dynamodb.AttributeType.STRING),
            removal_policy=removal_policy,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )
        orders_table.add_global_secondary_index(
            index_name="CustomerIndex",
            partition_key=dynamodb.Attribute(name="customer_id", type=dynamodb.AttributeType.STRING)
        )
        orders_table.add_global_secondary_index(
            index_name="SellerIndex",
            partition_key=dynamodb.Attribute(name="seller_id", type=dynamodb.AttributeType.STRING)
        )

        customers_table = dynamodb.Table(
            self, "CustomersTable",
            table_name="TwoSoulsCustomersTable",
            partition_key=dynamodb.Attribute(name="customer_id", type=dynamodb.AttributeType.STRING),
            removal_policy=removal_policy,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )

        # 3. Lambda Handler
        handler = _lambda.Function(
            self, "MarketplaceHandler",
            function_name="TwoSoulsMarketplaceHandler",
            runtime=_lambda.Runtime.PYTHON_3_12,
            code=_lambda.Code.from_asset("lambda"),
            handler="handler.handler",
            timeout=Duration.seconds(10),
            environment={
                'SELLERS_TABLE': sellers_table.table_name,
                'PRODUCTS_TABLE': products_table.table_name,
                'ORDERS_TABLE': orders_table.table_name,
                'CUSTOMERS_TABLE': customers_table.table_name,
                'BUCKET_NAME': image_bucket.bucket_name,
                'ADMIN_USERNAME': self.node.try_get_context("admin_username") or "admin",
                'ADMIN_PASSWORD': self.node.try_get_context("admin_password") or "TwoSouls@2026!"
            }
        )
        
        # Grant permissions
        sellers_table.grant_read_write_data(handler)
        products_table.grant_read_write_data(handler)
        orders_table.grant_read_write_data(handler)
        customers_table.grant_read_write_data(handler)
        image_bucket.grant_put(handler)
        image_bucket.grant_read(handler)

        # 4. API Gateway with CORS
        api = apigateway.LambdaRestApi(
            self, "MarketplaceApi",
            rest_api_name="TwoSoulsMarketplaceApi",
            handler=handler,
            proxy=True,
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token']
            ),
            deploy_options=apigateway.StageOptions(stage_name="prod")
        )

        # 5. Secret for GitHub Token
        github_token_secret = secretsmanager.Secret(
            self, "GitHubTokenSecret",
            secret_name="github-token",
            secret_string_value=SecretValue.unsafe_plain_text(
                self.node.try_get_context("github_token") or "dummy-token-for-init"
            )
        )

        # 6. IAM Role for Amplify
        amplify_role = iam.Role(
            self, "AmplifyServiceRole",
            assumed_by=iam.ServicePrincipal("amplify.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AdministratorAccess-Amplify")
            ]
        )

        # 7. AWS Amplify for Frontend
        amplify_app = amplify.App(
            self, "TwoSoulsFrontendApp",
            source_code_provider=amplify.GitHubSourceCodeProvider(
                owner=self.node.try_get_context("repo_owner") or "immohit4all-maker",
                repository=self.node.try_get_context("repo_name") or "two-souls-backend",
                oauth_token=github_token_secret.secret_value
            ),
            role=amplify_role,
            build_spec=codebuild.BuildSpec.from_object_to_yaml({
                "version": 1,
                "applications": [
                    {
                        "frontend": {
                            "phases": {
                                "preBuild": {
                                    "commands": [
                                        "npm ci"
                                    ]
                                },
                                "build": {
                                    "commands": [
                                        "npm run build"
                                    ]
                                }
                            },
                            "artifacts": {
                                "baseDirectory": "dist",
                                "files": [
                                    "**/*"
                                ]
                            },
                            "cache": {
                                "paths": [
                                    "node_modules/**/*"
                                ]
                            }
                        },
                        "appRoot": "frontend"
                    }
                ]
            }),
            environment_variables={
                "VITE_API_URL": api.url,
            },
            auto_branch_creation=amplify.AutoBranchCreation(patterns=["main"]),
            auto_branch_deletion=True
        )
        amplify_app.add_branch("main")

