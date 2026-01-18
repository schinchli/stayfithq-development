# Repository Optimization Plan

## Current Issues

### 1. Root Directory Clutter
- Too many files at root level (15+ files)
- Mix of documentation, config, and scripts
- Unclear entry points

### 2. Duplicate Content
- `docs/organized-project/` appears to duplicate root structure
- Multiple similar deployment scripts
- Redundant test files in different locations

### 3. Poor Organization
- `src/web/` and `src/pages/` contain similar HTML files
- `src/assets/` duplicates `src/web/css` and `src/web/js`
- Multiple MCP server implementations

### 4. Documentation Sprawl
- 50+ documentation files scattered across subdirectories
- Unclear documentation hierarchy
- Redundant guides

## Proposed Structure

```
stayfithq-development/
├── README.md                          # Main project overview
├── CONTRIBUTING.md                    # Contribution guidelines
├── LICENSE                            # License file
├── package.json                       # Dependencies
├── package-lock.json                  # Lock file
│
├── .github/                           # GitHub specific files
│   ├── workflows/                     # CI/CD workflows
│   └── ISSUE_TEMPLATE/               # Issue templates
│
├── config/                            # Configuration files
│   ├── .env.template                 # Environment template
│   ├── aws/                          # AWS configs
│   └── mcp/                          # MCP configs
│
├── docs/                              # All documentation
│   ├── README.md                     # Documentation index
│   ├── getting-started/              # Setup guides
│   ├── architecture/                 # Architecture docs
│   ├── deployment/                   # Deployment guides
│   ├── security/                     # Security docs
│   └── api/                          # API documentation
│
├── infrastructure/                    # Infrastructure as Code
│   ├── terraform/                    # Terraform configs
│   ├── cloudformation/               # CloudFormation templates
│   └── lambda/                       # Lambda functions
│
├── scripts/                           # Utility scripts
│   ├── deployment/                   # Deployment scripts
│   ├── setup/                        # Setup scripts
│   └── maintenance/                  # Maintenance scripts
│
├── src/                               # Application source
│   ├── web/                          # Web application
│   │   ├── pages/                    # HTML pages
│   │   ├── css/                      # Stylesheets
│   │   ├── js/                       # JavaScript
│   │   └── assets/                   # Images, fonts
│   │
│   ├── server/                       # Backend server
│   │   ├── api/                      # API routes
│   │   ├── middleware/               # Middleware
│   │   └── services/                 # Business logic
│   │
│   ├── mcp/                          # MCP server
│   ├── ai/                           # AI services
│   ├── aws/                          # AWS integrations
│   └── shared/                       # Shared utilities
│
└── tests/                             # All tests
    ├── unit/                         # Unit tests
    ├── integration/                  # Integration tests
    └── e2e/                          # End-to-end tests
```

## Optimization Actions

### Phase 1: Consolidate Web Assets
- [ ] Merge `src/web/` and `src/pages/` into `src/web/pages/`
- [ ] Consolidate CSS files into `src/web/css/`
- [ ] Consolidate JS files into `src/web/js/`
- [ ] Remove duplicate asset folders

### Phase 2: Clean Root Directory
- [ ] Move all `.md` files to appropriate `docs/` subdirectories
- [ ] Move `.env.template` to `config/`
- [ ] Keep only: README.md, package.json, package-lock.json, .gitignore

### Phase 3: Organize Scripts
- [ ] Categorize scripts into deployment/setup/maintenance
- [ ] Remove duplicate deployment scripts
- [ ] Consolidate similar functionality

### Phase 4: Simplify Documentation
- [ ] Remove `docs/organized-project/` (redundant)
- [ ] Create clear documentation index
- [ ] Consolidate similar guides
- [ ] Remove outdated status reports

### Phase 5: Infrastructure Cleanup
- [ ] Consolidate Lambda functions
- [ ] Organize AWS setup files
- [ ] Remove unused configurations

### Phase 6: Source Code Organization
- [ ] Create clear separation: web/server/mcp
- [ ] Move shared utilities to `src/shared/`
- [ ] Organize by feature, not file type

## Benefits

1. **Clarity** - Clear project structure, easy to navigate
2. **Maintainability** - Easier to find and update files
3. **Scalability** - Room for growth without clutter
4. **Onboarding** - New developers can understand structure quickly
5. **CI/CD** - Clearer paths for automation

## Implementation

Run the optimization script:
```bash
node scripts/optimize-repository.js
```

Or apply changes manually following this plan.
