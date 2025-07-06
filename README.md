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
git clone https://github.com/schinchli/StayFitHQ.git
cd StayFitHQ

# Install dependencies
npm install

# Set up environment variables
cp .env.template .env
# Edit .env with your configuration

# Start development server
npm start
```

### Environment Variables

Copy `.env.template` to `.env` and configure:

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

- [Installation Guide](INSTALLATION.md)
- [Development Journey](MASTER_DEVELOPMENT_JOURNEY.md)
- [Technical Specifications](TECHNICAL_PROMPTS.md)
- [Deployment Guide](DEPLOYMENT_PROMPTS.md)
- [Architecture Diagrams](docs/)

## 🛠️ Development

### Project Structure

```
StayFitHQ/
├── src/                 # Source code
├── docs/               # Documentation
├── scripts/            # Build and deployment scripts
├── tests/              # Test files
├── infrastructure/     # AWS infrastructure code
└── config/            # Configuration files
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

See [Deployment Guide](DEPLOYMENT_PROMPTS.md) for detailed instructions.

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

- Create an [Issue](https://github.com/schinchli/StayFitHQ/issues)
- Check the [Documentation](docs/)
- Review [Installation Guide](INSTALLATION.md)

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with wearable devices
- [ ] AI-powered health insights
- [ ] Multi-language support

---

**Built with ❤️ for health and fitness enthusiasts**
