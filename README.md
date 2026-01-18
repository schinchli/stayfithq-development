# StayFitHQ - Health & Fitness Dashboard

[![AWS](https://img.shields.io/badge/AWS-Cloud%20Ready-orange)](https://aws.amazon.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🏥 Overview

StayFitHQ is a comprehensive health and fitness dashboard application built with modern web technologies and designed for AWS cloud deployment. The application provides users with tools to track their health metrics, fitness goals, and wellness journey.

## ✨ Features

- **📊 Health Dashboard** - Comprehensive health metrics tracking
- **🏃‍♂️ Fitness Tracking** - Exercise and activity monitoring  
- **📈 Progress Analytics** - Visual progress tracking and insights
- **🔒 Secure Authentication** - User account management and security
- **📱 Responsive Design** - Mobile-first responsive interface
- **☁️ Cloud Ready** - AWS cloud deployment architecture

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- AWS CLI (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/schinchli/stayfithq-development.git
cd stayfithq-development

# Install dependencies
npm install

# Set up environment variables
cp config/.env.template config/.env
# Edit config/.env with your configuration

# Start development server
npm start
```

### Environment Variables

Copy `config/.env.template` to `config/.env` and configure:

```env
# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=your_database_connection_string

# AWS Configuration (for deployment)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# API Configuration
API_BASE_URL=https://your-api-endpoint.com
API_KEY=your_api_key
```

## 🏗️ Architecture

StayFitHQ is built with a modern, scalable architecture:

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Database**: DynamoDB (AWS) / MongoDB
- **Cloud**: AWS (ECS, S3, CloudFront, API Gateway)
- **Security**: WAF, IAM, encryption at rest and in transit

### AWS Architecture Diagrams

Comprehensive AWS architecture diagrams are available in:
- `docs/AWS_ARCHITECTURE_DIAGRAMS.md`
- `docs/INFRASTRUCTURE_DIAGRAMS.md`

## 📚 Documentation

- [Installation Guide](docs/getting-started/INSTALLATION.md)
- [Development Journey](docs/getting-started/DEVELOPMENT_JOURNEY.md)
- [Technical Specifications](docs/development/TECHNICAL_PROMPTS.md)
- [Deployment Guide](docs/deployment/PROMPTS.md)
- [Architecture & Design](docs/architecture/)
- [Security Documentation](docs/security/)
- [Testing Guide](tests/README.md)

## 🛠️ Development

### Project Structure

```
stayfithq-development/
├── README.md                    # Project overview
├── OPTIMIZATION_PLAN.md         # Repository optimization details
├── package.json                 # Dependencies and scripts
│
├── config/                      # Configuration files
│   ├── .env.template           # Environment variables template
│   ├── aws/                    # AWS-specific configs
│   └── mcp/                    # MCP server configs
│
├── docs/                        # Documentation
│   ├── getting-started/        # Setup and installation guides
│   ├── development/            # Development guides and prompts
│   ├── deployment/             # Deployment guides
│   ├── architecture/           # Architecture and design docs
│   ├── security/               # Security documentation
│   ├── testing/                # Testing guides
│   └── api/                    # API documentation
│
├── infrastructure/              # Infrastructure as Code
│   ├── terraform/              # Terraform configurations
│   ├── cloudformation/         # CloudFormation templates
│   └── lambda/                 # Lambda function code
│
├── scripts/                     # Utility scripts
│   ├── deployment/             # Deployment automation
│   ├── setup/                  # Setup and configuration
│   └── maintenance/            # Maintenance and optimization
│
├── src/                         # Application source code
│   ├── web/                    # Frontend application
│   │   ├── pages/              # HTML pages
│   │   ├── css/                # Stylesheets
│   │   ├── js/                 # JavaScript modules
│   │   └── components/         # Reusable components
│   │
│   ├── server/                 # Backend server
│   │   ├── index.js            # Main server entry
│   │   └── middleware/         # Express middleware
│   │
│   ├── mcp/                    # Model Context Protocol server
│   ├── ai/                     # AI/ML services (Bedrock, etc.)
│   ├── aws/                    # AWS service integrations
│   ├── shared/                 # Shared utilities
│   │   ├── processors/         # Data processors
│   │   └── integration/        # Integration services
│   │
│   ├── compliance/             # HIPAA and compliance
│   ├── security/               # Security frameworks
│   └── standards/              # Healthcare standards (FHIR, OpenEHR)
│
└── tests/                       # Test suites
    ├── unit/                   # Unit tests
    ├── integration/            # Integration tests
    └── README.md               # Testing documentation
```

### Available Scripts

```bash
npm start          # Start development server
npm test           # Run tests
npm run build      # Build for production
npm run deploy     # Deploy to AWS
npm run lint       # Run code linting
```

## 🚀 Deployment

### AWS Deployment

The application is designed for AWS cloud deployment with:

- **ECS Fargate** for container orchestration
- **Application Load Balancer** for traffic distribution
- **DynamoDB** for data storage
- **S3 + CloudFront** for static assets
- **API Gateway** for API management

See [Deployment Guide](docs/deployment/PROMPTS.md) for detailed instructions.

### Local Development

```bash
# Start local development server
npm run dev

# Access the application
open http://localhost:3000
```

## 🔒 Security

- All sensitive credentials removed from repository
- Environment variables for configuration
- AWS IAM roles and policies
- Encryption at rest and in transit
- Regular security scanning and updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an [Issue](https://github.com/schinchli/stayfithq-development/issues)
- Check the [Documentation](docs/)
- Review [Installation Guide](docs/getting-started/INSTALLATION.md)

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with wearable devices
- [ ] AI-powered health insights
- [ ] Multi-language support

---

**Built with ❤️ for health and fitness enthusiasts**
