#!/bin/bash

# CentomoMD AWS Infrastructure Deployment Script
# This script deploys the AWS infrastructure for CentomoMD

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="centomomd-infrastructure"
TEMPLATE_FILE="cloudformation-template.yaml"
REGION="ca-central-1"
ENVIRONMENT=${1:-development}

echo -e "${BLUE}🚀 CentomoMD AWS Infrastructure Deployment${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Region: ${GREEN}${REGION}${NC}"
echo -e "Stack Name: ${GREEN}${STACK_NAME}-${ENVIRONMENT}${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials are not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Validate CloudFormation template
echo -e "${YELLOW}📋 Validating CloudFormation template...${NC}"
if aws cloudformation validate-template --template-body file://${TEMPLATE_FILE} --region ${REGION} > /dev/null; then
    echo -e "${GREEN}✅ Template validation successful${NC}"
else
    echo -e "${RED}❌ Template validation failed${NC}"
    exit 1
fi

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-${ENVIRONMENT} --region ${REGION} 2>/dev/null || echo "false")

if [ "$STACK_EXISTS" != "false" ]; then
    echo -e "${YELLOW}📦 Stack exists. Updating...${NC}"
    OPERATION="update-stack"
    WAIT_OPERATION="stack-update-complete"
else
    echo -e "${YELLOW}📦 Stack does not exist. Creating...${NC}"
    OPERATION="create-stack"
    WAIT_OPERATION="stack-create-complete"
fi

# Deploy the stack
echo -e "${YELLOW}🚀 Deploying infrastructure...${NC}"
aws cloudformation ${OPERATION} \
    --stack-name ${STACK_NAME}-${ENVIRONMENT} \
    --template-body file://${TEMPLATE_FILE} \
    --parameters ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
                 ParameterKey=ProjectName,ParameterValue=centomomd \
    --capabilities CAPABILITY_NAMED_IAM \
    --region ${REGION} \
    --tags Key=Project,Value=centomomd Key=Environment,Value=${ENVIRONMENT} Key=Compliance,Value=HIPAA-PIPEDA-Law25

# Wait for stack operation to complete
echo -e "${YELLOW}⏳ Waiting for stack operation to complete...${NC}"
aws cloudformation wait ${WAIT_OPERATION} \
    --stack-name ${STACK_NAME}-${ENVIRONMENT} \
    --region ${REGION}

# Get stack outputs
echo -e "${YELLOW}📊 Getting stack outputs...${NC}"
aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME}-${ENVIRONMENT} \
    --region ${REGION} \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo -e "${GREEN}✅ Infrastructure deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "1. Update your .env file with the values from the stack outputs"
echo -e "2. Configure your AWS credentials for the application"
echo -e "3. Set up your Supabase project and update the database URL"
echo -e "4. Run 'npm run dev' to start the development server"
echo ""

# Display important information
echo -e "${BLUE}🔐 Security Notes:${NC}"
echo -e "- All resources are configured for ca-central-1 region (Montreal)"
echo -e "- S3 bucket has 24-hour lifecycle policy for compliance"
echo -e "- CloudTrail is enabled for audit logging"
echo -e "- All data is encrypted at rest and in transit"
echo -e "- IAM roles follow least privilege principle"
echo ""

echo -e "${GREEN}🎉 CentomoMD infrastructure is ready!${NC}"
