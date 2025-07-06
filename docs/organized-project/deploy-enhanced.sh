#!/bin/bash

# Enhanced Healthcare Platform Deployment Script
# HIPAA-compliant deployment with FHIR R4 and openEHR support

set -e

echo "🏥 Starting Enhanced Healthcare Platform Deployment..."
echo "🔒 HIPAA-compliant with FHIR R4 and openEHR standards"

# Environment variables
export NODE_ENV=${NODE_ENV:-production}
export AWS_REGION=${AWS_REGION:-us-east-1}

# Install dependencies
echo "📦 Installing enhanced dependencies..."
npm install

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p logs
mkdir -p src/compliance
mkdir -p src/standards
mkdir -p src/security
mkdir -p src/architecture
mkdir -p src/integration

# Set up environment file
echo "⚙️ Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
fi

# Build the application
echo "🔨 Building enhanced healthcare application..."
npm run build

# Deploy to AWS
echo "☁️ Deploying to AWS with enhanced security..."
./deploy-s3-cloudfront.sh

echo "✅ Enhanced Healthcare Platform deployed successfully!"
echo "🌐 Features enabled:"
echo "   - HIPAA Compliance Framework"
echo "   - FHIR R4 Standard Implementation"
echo "   - openEHR Integration"
echo "   - Enhanced Security Framework"
echo "   - Scalable Architecture"
echo "   - Real-time Monitoring"

echo "🔗 Access your application at: https://d3r155fcnafufg.cloudfront.net/"
