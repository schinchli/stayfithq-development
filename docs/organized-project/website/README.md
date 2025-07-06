# Website - StayFit Health Companion

> **Production-ready healthcare web application with 30-minute session management**

## 🌐 **Live Platform**
**Production URL**: https://YOUR-DOMAIN.cloudfront.net

---

## 📁 **Website Structure**

### **📄 HTML Pages (10 pages)**
```
├── index.html              # Main dashboard & homepage
├── dashboard.html          # Advanced analytics dashboard  
├── settings.html           # User settings & preferences
├── health-reports.html     # Health analytics & reports
├── search.html            # AI-powered health search
├── digital-analysis.html  # Digital health analysis
├── abha-integration.html  # Government health ID integration
├── wiki.html              # Health information wiki
├── import.html            # Health data import
└── login.html             # Authentication page
```

### **🎨 CSS Styling**
```
css/
├── bootstrap-theme-unified.css    # Bootstrap customization
├── navigation-unified.css         # Navigation styling
├── layout-unified.css            # Page layout & structure
├── footer-unified.css            # Footer styling
├── uniform_page_header.css       # Page header styling
└── unified-layout-override.css   # Layout overrides
```

### **⚡ JavaScript Functionality**
```
js/
├── cognito-auth-universal.js     # Authentication system
├── session-manager.js            # 30-minute session management
├── global-theme.js              # Theme management
├── health-reports-complete-charts.js  # Health analytics
├── opensearch-mcp-integration.js      # Search integration
├── ai-backend-simple-with-cache.js    # AI backend
├── sample-questions-cache.js          # Search cache
└── cache-testing-system.js           # Cache management
```

---

## 🎯 **Key Features**

### **🔐 Authentication & Sessions**
- **30-minute sessions** with automatic token refresh
- **Visual session timer** in top-right corner
- **Session expiry warnings** at 5-minute mark
- **Cognito Hosted UI** integration
- **Cross-page session persistence**

### **🏥 Healthcare Pages**
- **Health Reports** - Comprehensive analytics with charts
- **Digital Analysis** - AI-powered health insights
- **ABHA Integration** - Government health ID support
- **Health Data Import** - Secure file processing
- **AI Search** - Intelligent health information retrieval

### **🎨 User Experience**
- **Responsive design** - Mobile-first approach
- **Unified navigation** - Consistent across all pages
- **Professional healthcare branding** - Medical-grade interface
- **Accessibility compliant** - WCAG 2.1 AA standards

---

## 🚀 **Deployment**

### **Production Deployment**
```bash
# Upload to S3
aws s3 sync . s3://stayfit-healthhq-web-prod/

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
```

### **Local Development**
```bash
# Serve locally
npx http-server . -p 8080

# Or use Python
python -m http.server 8080
```

---

## 📊 **Page Analytics**

| Page | Size | Features | Status |
|------|------|----------|---------|
| **index.html** | 15KB | Dashboard, widgets | ✅ Active |
| **dashboard.html** | 16KB | Advanced analytics | ✅ Active |
| **settings.html** | 115KB | User preferences | ✅ Active |
| **health-reports.html** | 40KB | Health charts | ✅ Active |
| **search.html** | 29KB | AI search | ✅ Active |
| **digital-analysis.html** | 38KB | Health analysis | ✅ Active |
| **abha-integration.html** | 34KB | Gov health ID | ✅ Active |
| **wiki.html** | 75KB | Health wiki | ✅ Active |
| **import.html** | 36KB | Data import | ✅ Active |
| **login.html** | 22KB | Authentication | ✅ Active |

---

## 🔧 **Technical Implementation**

### **Session Management**
- **Token Duration**: 30 minutes
- **Auto-refresh**: Every 5 minutes
- **Visual Feedback**: Real-time countdown timer
- **Cross-page**: Session persists across navigation
- **Security**: Secure token storage and validation

### **Authentication Flow**
1. User clicks "Sign In" → Cognito Hosted UI
2. Successful auth → Redirect to dashboard
3. Session timer starts → 30-minute countdown
4. Auto-refresh → Tokens refreshed every 5 minutes
5. Expiry warning → 5 minutes before expiry
6. Session extension → One-click renewal

### **Responsive Design**
- **Mobile-first** - Optimized for mobile devices
- **Tablet-friendly** - Proper spacing and layout
- **Desktop-optimized** - Full-width professional appearance
- **Cross-browser** - Compatible with all modern browsers

---

## 🏥 **Healthcare Standards**

### **Compliance Features**
- **HIPAA-Compliant** - Secure data handling
- **FHIR R4** - Healthcare interoperability
- **openEHR** - Open health records
- **WCAG 2.1 AA** - Web accessibility

### **Professional Branding**
- **Healthcare Excellence** - Mission-focused design
- **Professional Attribution** - Shashank Chinchli, Solutions Architect, AWS
- **Medical-grade Interface** - Clean, professional appearance
- **Trust Indicators** - Security and compliance badges

---

## 🎉 **Production Status**

### **✅ Live Features**
- **All 10 pages** deployed and functional
- **30-minute sessions** with visual feedback
- **Professional healthcare branding** across all pages
- **Mobile-responsive** design
- **Enterprise security** implementation

### **✅ Performance**
- **Fast loading** - Optimized assets
- **CDN delivery** - Global CloudFront distribution
- **Caching** - Intelligent cache management
- **Monitoring** - Real-time performance tracking

---

*Website deployed and maintained by Shashank Chinchli, Solutions Architect, AWS*
