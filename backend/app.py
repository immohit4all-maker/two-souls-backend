#!/usr/bin/env python3
import aws_cdk as cdk

from backend.backend_stack import BackendStack

# SECURITY WARNING: Hardcoding account IDs and regions is generally discouraged
# for production environments as it reduces portability and can lead to
# accidental leakage of infrastructure details in version control.
env = cdk.Environment(
    account='436822148052', # Hardcoded Account ID
    region='us-east-1'      # Hardcoded Region
)

app = cdk.App()
BackendStack(app, "TwoSoulsBackendStack",
    env=env,
    description="Backend stack for Two Souls API Gateway and Sellers Table.",
)

app.synth()
