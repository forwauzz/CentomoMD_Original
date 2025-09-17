# CentomoMD - Bilingual Medical Documentation Platform

A HIPAA, PIPEDA, and Quebec Law 25 compliant platform for real-time bilingual (French/English) medical transcription and CNESST evaluation documentation.

## 🏥 Overview

CentomoMD enables healthcare professionals to conduct real-time bilingual transcription of doctor-patient conversations, automatically structuring content into CNESST evaluation sections (7, 8, 11) with AI-assisted formatting and export capabilities.

## 🔒 Compliance Features

- **Zero-retention**: Audio and transcripts processed in-memory, deleted immediately
- **Patient consent**: Verified by in-person signature, stored as consent_verified boolean
- **Regional compliance**: Deployed exclusively in ca-central-1 (Montreal) for Canadian data residency
- **Audit logging**: Metadata-only logging (who/when/what/type/status/duration/size)
- **PHI protection**: Never logs or persists Personal Health Information

## 🧩 Technical Architecture

### Frontend
- **Framework**: React + Vite + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Language**: French-first UI (Quebec clinics)
- **Real-time**: WebSocket streaming for live transcription
- **Components**: Modular UI with medical theme
- **State Management**: React hooks + Zustand

### Backend
- **Runtime**: Node.js + Express + TypeScript
- **Transcription**: AWS Transcribe Standard Streaming API
- **Database**: Supabase (PostgreSQL) with RLS policies
- **ORM**: Drizzle ORM
- **Storage**: AWS S3 with 24h lifecycle policies
- **WebSocket**: Real-time communication for transcription

### AWS Infrastructure
- **Region**: ca-central-1 (Montreal) for data residency
- **Services**: Transcribe, S3, CloudWatch, CloudTrail, IAM
- **Security**: Encryption at rest/in-transit, least privilege access
- **Compliance**: HIPAA, PIPEDA, Quebec Law 25 compliant
- **Monitoring**: CloudWatch dashboards and alerts
- **Deployment**: CloudFormation templates with automated scripts

### Transcription Engine
- **Service**: AWS Standard Transcribe (not Medical)
- **Region**: ca-central-1 (Montreal)
- **Streaming**: Up to 60 minutes per session
- **Languages**: Automatic English-French detection
- **Voice commands**: Template library integration for AI formatting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- AWS Account with Transcribe access
- Supabase project
- Git
- AWS CLI (for infrastructure deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd centomo-md

# Deploy AWS Infrastructure
cd aws
chmod +x deploy.sh
./deploy.sh development
cd ..

# Install all dependencies
npm run install:all

# Set up environment variables
cp env.example .env
# Edit .env with your AWS and Supabase credentials from infrastructure outputs

# Set up database
npm run setup:db

# Start development servers
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:5173

### Environment Variables

Create a `.env` file in the root directory:

```env
# AWS Configuration
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# S3 Configuration
S3_BUCKET_NAME=centomo-md-temp
S3_REGION=ca-central-1
```

## 📁 Project Structure

```
centomomd/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Environment and AWS config
│   │   ├── database/       # Drizzle ORM schema
│   │   ├── middleware/     # Auth, error handling, performance
│   │   ├── services/       # Transcription, template services
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Logging, utilities
│   ├── templates/          # CNESST section templates
│   └── package.json
├── frontend/               # React/Vite frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   └── transcription/ # Transcription interface
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   └── types/          # TypeScript interfaces
│   └── package.json
├── aws/                    # AWS infrastructure
│   ├── cloudformation-template.yaml
│   ├── iam-policy.json
│   ├── s3-bucket-policy.json
│   ├── deploy.sh
│   └── README.md
├── env.example             # Environment variables template
├── package.json            # Root package.json
└── README.md
```

## 📋 Transcription Modes

| Mode | Description | Output Format | Use Case |
|------|-------------|---------------|----------|
| Word-for-Word | Raw live speech-to-text | Plain paragraph | Fast, accurate capture |
| Smart Dictation | AI-assisted, medical structured | Section 7-11 templates | Final reports, AI summaries |
| Ambient | Long-form capture, diarized | Streaming + merge | Only with signed consent |

## 🎤 Voice Commands

| Command | Behavior |
|---------|----------|
| "Démarrer transcription" | Begins current mode |
| "Pause transcription" | Pauses without saving |
| "Fin section [X]" | Saves transcript to section X |
| "Effacer" | Clears last transcript buffer |
| "Nouveau paragraphe" | Line break |
| "Sauvegarder et continuer" | Commits section and opens next |

## 📊 CNESST Section Mapping

### Section 7 – Historique de faits et évolution
- Chronological narrative
- Structure: Incident description, Medical evolution, Imaging/treatment history
- Voice cues: "Debut historique", "Fin section sept"

### Section 8 – Questionnaire subjectif
- Structured subjective data (pain scale, ADLs, patient's perception)
- Voice cues: "Nouvelle plainte", "Impact sur les activités", "Fin section huit"

### Section 11 – Conclusion médicale
- Summaries, diagnostics, consolidation dates, impairments
- Voice cues: "Résumé médical", "Pourcentage atteinte", "Conclusion finale"

## 📁 Project Structure

```
centomo-md/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   ├── templates/           # Template library
│   └── tests/               # Backend tests
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   └── tests/               # Frontend tests
├── shared/                  # Shared types and utilities
└── docs/                    # Documentation
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run test         # Run tests
npm run build        # Build for production
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run test         # Run tests
npm run build        # Build for production
```

### Database Management
```bash
npm run db:setup     # Set up database schema
npm run db:migrate   # Run migrations
npm run db:seed      # Seed with test data
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run tests with coverage
npm run test:coverage
```

## 📦 Production Deployment

### Build
```bash
npm run build
```

### Environment Setup
1. Configure production environment variables
2. Set up AWS IAM roles and permissions
3. Configure Supabase RLS policies
4. Set up monitoring and logging

### Deployment Options
- **Docker**: Use provided Dockerfile
- **Vercel**: Frontend deployment
- **Railway/Render**: Backend deployment
- **AWS ECS**: Full-stack deployment

## 🔍 Monitoring & Logging

- **Application Logs**: Structured logging with Winston
- **Error Tracking**: Sentry integration
- **Performance**: AWS CloudWatch metrics
- **Compliance**: Audit trail logging (metadata only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For technical support or compliance questions:
- Create an issue in the repository
- Contact the development team
- Review the documentation in `/docs`

## 🔐 Security

- All code is reviewed for security vulnerabilities
- Regular dependency updates
- Compliance with healthcare security standards
- No PHI stored in logs or error reports

---

**Built with ❤️ for the Canadian healthcare community**
