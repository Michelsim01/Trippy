# CI/CD Pipeline Documentation

This repository includes automated CI/CD pipelines using GitHub Actions to ensure code quality and build integrity across all project components.

## 🔧 Pipeline Overview

The project contains four workflow files:

### 1. **Basic CI/CD Pipeline** (`ci-cd.yml`)
- **Trigger**: Push to `master` branch, Pull requests to `master`
- **Components Tested**: Backend, Frontend, Admin Frontend, Data Pipeline
- **Features**:
  - Parallel job execution for faster builds
  - Dependency caching for improved performance
  - Resilient testing (continues on test failures)
  - Build summary report

### 2. **Advanced CI/CD Pipeline** (`advanced-ci-cd.yml`)
- **Trigger**: Push to `master`/`develop`, Pull requests to `master`
- **Enhanced Features**:
  - Security dependency auditing
  - Multi-Node.js version testing (18, 20)
  - Code quality checks (ESLint, Flake8, Black)
  - Integration tests with PostgreSQL
  - Detailed build artifacts
  - Comprehensive status reporting

### 3. **Pull Request Check** (`pr-check.yml`)
- **Trigger**: Pull request events (opened, synchronized, reopened)
- **Smart Features**:
  - Only tests changed components
  - Faster feedback for developers
  - Change detection and summary

### 4. **Build Status Check** (`build-status.yml`)
- **Trigger**: Push to `master` and Pull requests
- **Focus**: Core build verification with detailed reporting
- **Features**:
  - Non-blocking code quality assessment
  - Core build verification (must pass)
  - Comprehensive status summary
  - Troubleshooting guidance

## 🏗️ Build Matrix

| Component | Technology | Build Tool | Tests | Linting |
|-----------|------------|------------|-------|---------|
| Backend | Java 17 + Spring Boot | Maven | Unit Tests | - |
| Frontend | React + Vite | npm | Build Check | ESLint |
| Admin Frontend | React + Vite | npm | Build Check | ESLint |
| Data Pipeline | Python 3.9 + Airflow | pip | Syntax Check | Flake8 |

## 📊 Pipeline Jobs

### Backend Build
- JDK 17 setup with Temurin distribution
- Maven dependency caching
- Clean compile → Test → Package
- Test report generation
- JAR artifact upload

### Frontend Builds
- Node.js 18/20 setup
- npm dependency caching
- ESLint code quality checks
- Vite build process
- Build artifact upload with size analysis

### Data Pipeline
- Python 3.9 setup
- pip dependency caching
- Code formatting check (Black)
- Syntax validation
- Flake8 linting

### Security & Quality
- npm audit for frontend dependencies
- Maven dependency vulnerability check
- Code formatting verification
- Build size monitoring

## 🚀 Getting Started

### Prerequisites
Ensure your project has the following files with correct scripts:

#### Backend (`backend/`)
- `pom.xml` with Spring Boot parent
- `mvnw` wrapper with execute permissions
- Standard Maven directory structure

#### Frontend (`frontend/`)
```json
{
  "scripts": {
    "build": "vite build",
    "lint": "eslint ."
  }
}
```

#### Admin Frontend (`admin_frontend/`)
```json
{
  "scripts": {
    "build": "vite build",
    "lint": "eslint . --ext js,jsx"
  }
}
```

#### Data Pipeline (`data-pipeline/`)
- `requirements.txt` with all dependencies
- Python files with proper syntax

### Local Testing

Test your builds locally before pushing:

```bash
# Backend
cd backend
./mvnw clean test package

# Frontend
cd frontend
npm install
npm run lint
npm run build

# Admin Frontend  
cd admin_frontend
npm install
npm run lint
npm run build

# Data Pipeline
cd data-pipeline
pip install -r requirements.txt
python -m py_compile $(find . -name "*.py")
flake8 .
```

## 📈 Monitoring & Notifications

### Build Status
- ✅ **Success**: All components build successfully
- ❌ **Failure**: One or more components failed
- ⚠️ **Warning**: Build succeeded with warnings

### Artifacts
- Backend JAR files
- Frontend/Admin build distributions
- Test reports and coverage data

### Reports
Each workflow generates a summary with:
- Component-wise build status
- Test results and coverage
- Security audit findings
- Build performance metrics

## 🔧 Customization

### Adding New Components
1. Add new job in workflow files
2. Set up appropriate language/runtime
3. Configure caching for dependencies
4. Add build and test steps
5. Update build summary job

### Modifying Triggers
```yaml
on:
  push:
    branches: [ master, develop, feature/* ]
  pull_request:
    branches: [ master ]
  schedule:
    - cron: '0 2 * * 1'  # Weekly builds
```

### Environment Variables
Add secrets in GitHub repository settings:
- Database connection strings
- API keys
- Build configuration

## 🐛 Troubleshooting

### Current Known Issues

**Backend Test Failures**
- Tests are currently failing due to ApplicationContext loading issues
- **Workaround**: Tests are set to non-blocking in CI/CD pipeline
- **Next Steps**: 
  1. Configure H2 test database properly
  2. Add `@TestPropertySource` annotations to test classes
  3. Create proper test configuration classes

**Frontend ESLint Issues**
- Multiple unused variables and missing dependencies
- **Workaround**: Linting is set to non-blocking in CI/CD pipeline
- **Next Steps**:
  1. Remove unused imports and variables
  2. Add proper dependency arrays to useEffect hooks
  3. Fix regex escape character issues

### Current Build Status
- ✅ **Backend**: Compiles and packages successfully
- ✅ **Frontend**: Builds successfully (with linting warnings)
- ✅ **Admin Frontend**: Builds successfully (with linting warnings)
- ✅ **Data Pipeline**: Syntax validates successfully

### Quick Fixes

**Fix Backend Tests**
```bash
# Add this to test classes that are failing:
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
```

**Fix Frontend Linting**
```bash
cd frontend
# Fix unused variables
npm run lint -- --fix
```

### Common Issues

**Maven Permission Denied**
```bash
chmod +x mvnw
```

**Node.js Version Mismatch**
- Ensure Node.js version matches workflow
- Update `.nvmrc` if using nvm

**Python Import Errors**
- Verify all dependencies in `requirements.txt`
- Check Python version compatibility

**Build Timeouts**
- Optimize dependency caching
- Reduce test execution time
- Use matrix builds for parallel execution

### Debug Mode
Enable workflow debugging by setting repository secret:
```
ACTIONS_STEP_DEBUG = true
```

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Maven in GitHub Actions](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-java-with-maven)
- [Node.js in GitHub Actions](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)