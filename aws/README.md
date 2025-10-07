# CentomoMD AWS Infrastructure

This directory contains the AWS infrastructure configuration for CentomoMD, a medical documentation platform that complies with HIPAA, PIPEDA, and Quebec Law 25.

## 🏗️ Infrastructure Overview

The AWS infrastructure is designed with security, compliance, and performance in mind:

- **Region**: ca-central-1 (Montreal, Canada) for data residency compliance
- **Services**: AWS Transcribe, S3, CloudWatch, CloudTrail, IAM
- **Security**: Encryption at rest and in transit, least privilege access
- **Compliance**: HIPAA, PIPEDA, Quebec Law 25 compliant

## 📁 Files

### Core Infrastructure
- `cloudformation-template.yaml` - Main CloudFormation template
- `iam-policy.json` - IAM policy for application permissions
- `s3-bucket-policy.json` - S3 bucket security policy
- `deploy.sh` - Deployment script

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI** installed and configured
2. **AWS Account** with appropriate permissions
3. **Bash** shell (for deployment script)

### Deployment

1. **Clone and navigate to the project**:
   ```bash
   cd aws
   ```

2. **Make the deployment script executable**:
   ```bash
   chmod +x deploy.sh
   ```

3. **Deploy the infrastructure**:
   ```bash
   # For development
   ./deploy.sh development
   
   # For staging
   ./deploy.sh staging
   
   # For production
   ./deploy.sh production
   ```

4. **Update your environment variables**:
   Copy the values from the CloudFormation outputs to your `.env` file.

## 🔧 Infrastructure Components

### S3 Bucket
- **Purpose**: Temporary storage for audio files and transcripts
- **Lifecycle**: 24-hour automatic deletion for compliance
- **Encryption**: AES-256 server-side encryption
- **Access**: Private with strict IAM controls

### AWS Transcribe
- **Service**: Real-time streaming transcription
- **Languages**: French (fr-CA) and English (en-US)
- **Features**: Speaker diarization, automatic language detection
- **Region**: ca-central-1 for data residency

### CloudWatch
- **Logs**: Application and audit logging
- **Metrics**: Performance monitoring
- **Dashboard**: Real-time monitoring dashboard
- **Retention**: 30 days for logs, 7 years for audit logs

### CloudTrail
- **Purpose**: API call logging for compliance
- **Events**: All S3 and Transcribe API calls
- **Storage**: S3 bucket with log file validation
- **Retention**: 7 years for compliance requirements

### IAM
- **Principle**: Least privilege access
- **Roles**: Application-specific roles
- **Policies**: Restricted to ca-central-1 region
- **Monitoring**: CloudTrail integration

## 🔐 Security Features

### Data Protection
- **Encryption at Rest**: AES-256 for all stored data
- **Encryption in Transit**: TLS 1.2+ for all communications
- **Key Management**: AWS KMS for encryption keys
- **Access Control**: IAM roles with minimal permissions

### Compliance
- **Data Residency**: All data stays in ca-central-1
- **Audit Logging**: Complete API call history
- **Zero Retention**: Automatic deletion of temporary files
- **PHI Protection**: No PHI in logs or metadata

### Network Security
- **VPC**: Isolated network environment
- **Security Groups**: Restrictive firewall rules
- **WAF**: Web application firewall (if needed)
- **DDoS Protection**: AWS Shield Standard

## 📊 Monitoring and Alerting

### CloudWatch Dashboard
- Real-time transcription metrics
- S3 storage usage
- API call volumes
- Error rates and latency

### Alerts
- High error rates
- Storage capacity warnings
- Unusual API activity
- Compliance violations

## 🛠️ Maintenance

### Regular Tasks
- **Log Rotation**: Automatic via CloudWatch
- **Backup Verification**: Monthly compliance checks
- **Security Updates**: AWS managed updates
- **Cost Monitoring**: Monthly cost reviews

### Compliance Checks
- **Quarterly**: HIPAA compliance audit
- **Monthly**: PIPEDA compliance review
- **Weekly**: Security log review
- **Daily**: Automated health checks

## 🔄 Updates and Changes

### Infrastructure Updates
1. Modify the CloudFormation template
2. Test in development environment
3. Deploy to staging for validation
4. Deploy to production with rollback plan

### Security Updates
- Monitor AWS security advisories
- Apply security patches promptly
- Review and update IAM policies
- Conduct regular security assessments

## 📋 Compliance Checklist

### HIPAA Compliance
- [x] Data encryption at rest and in transit
- [x] Access controls and audit logging
- [x] Data residency in approved region
- [x] Automatic data deletion
- [x] Business associate agreement with AWS

### PIPEDA Compliance
- [x] Canadian data residency (ca-central-1)
- [x] Consent management
- [x] Data minimization
- [x] Right to deletion
- [x] Breach notification procedures

### Quebec Law 25
- [x] Enhanced consent requirements
- [x] Data portability
- [x] Automated decision-making transparency
- [x] Privacy by design implementation

## 🆘 Troubleshooting

### Common Issues

**Deployment Fails**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Validate template
aws cloudformation validate-template --template-body file://cloudformation-template.yaml
```

**Permission Errors**
```bash
# Check IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name YOUR_USERNAME
```

**Resource Limits**
```bash
# Check service limits
aws service-quotas list-service-quotas --service-code s3
aws service-quotas list-service-quotas --service-code transcribe
```

### Support

For infrastructure issues:
1. Check CloudWatch logs
2. Review CloudTrail events
3. Consult AWS documentation
4. Contact AWS support if needed

## 📚 Additional Resources

- [AWS Transcribe Documentation](https://docs.aws.amazon.com/transcribe/)
- [AWS Security Best Practices](https://aws.amazon.com/security/security-learning/)
- [HIPAA on AWS](https://aws.amazon.com/compliance/hipaa/)
- [PIPEDA Compliance Guide](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- [Quebec Law 25](https://www.quebec.ca/en/government/policies-orientations/cybersecurity-digital/act-modernizing-legislative-provisions-respect-protection-personal-information)
