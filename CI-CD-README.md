# CI/CD Pipeline Documentation

This project includes a comprehensive CI/CD pipeline using GitHub Actions that builds and tests all components of the Trippy application.

## Pipeline Overview

### 🔄 Main CI Pipeline (`ci.yml`)

Triggered on:
- Push to `master`, `main`, or `develop` branches
- Pull requests to `master` or `main` branches

**Components tested:**
1. **Backend (Java Spring Boot)**
   - Java 17 with Maven
   - Unit tests (excluding email-related tests)
   - Build and package JAR
   
2. **Frontend (React + Vite)**
   - Node.js 18
   - ESLint checks
   - Production build
   
3. **Admin Frontend (React + Vite)**
   - Node.js 18
   - ESLint checks
   - Production build
   
4. **Integration Verification**
   - Ensures all artifacts are created
   - Validates build outputs
   
5. **Security Scanning**
   - Trivy vulnerability scanner
   - Results uploaded to GitHub Security tab

### ⚡ Quick CI Pipeline (`quick-ci.yml`)

Triggered on:
- Push to feature branches (`feature/*`, `bugfix/*`)
- Pull requests to `develop` branch

**Purpose:** Fast feedback for development branches
- Compilation checks only
- Linting
- No full builds or tests

## 🚫 Email Test Exclusion

The CI pipeline excludes email-related tests to avoid external dependencies:

**Excluded test patterns:**
- `**/*EmailServiceTest.java`
- `**/*EmailControllerTest.java`
- `**/*MailTest.java`
- `**/*EmailTest.java`

**Configuration:**
- Uses `application-ci.properties` profile
- Disables email services in test environment
- Tests run with in-memory H2 database

## 🏃‍♂️ Running CI Tests Locally

Use the provided script to run the same tests that will execute in CI:

```bash
# From project root
./run-ci-tests.sh
```

This script will:
1. Install all dependencies
2. Run backend tests (excluding email tests)
3. Run frontend and admin frontend linting
4. Build all components
5. Verify all artifacts are created

## 📁 Generated Artifacts

After successful CI runs, the following artifacts are available:

- `backend-jar`: Spring Boot JAR file
- `frontend-dist`: Frontend production build
- `admin-frontend-dist`: Admin frontend production build

## 🔧 Configuration Files

### Backend Test Configuration
- `backend/src/test/resources/application-ci.properties`: CI-specific test configuration
- `backend/pom.xml`: Maven configuration with test exclusions

### Frontend Configuration
- `frontend/package.json`: Build and lint scripts
- `admin_frontend/package.json`: Build and lint scripts

## 🚨 Troubleshooting

### Common Issues

1. **Maven tests failing**
   - Check if you have Java 17 installed
   - Ensure Docker is running for Testcontainers (if used)
   - Run locally: `./mvnw test -Dspring.profiles.active=ci`

2. **Frontend lint errors**
   - Run locally: `npm run lint` in respective frontend directories
   - Fix ESLint warnings/errors

3. **Build failures**
   - Check Node.js version (should be 18+)
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Manual Testing Commands

```bash
# Backend only
cd backend
./mvnw test -Dspring.profiles.active=ci -Dtest='!**/*EmailServiceTest,!**/*EmailControllerTest,!**/*MailTest,!**/*EmailTest'

# Frontend only
cd frontend
npm ci && npm run lint && npm run build

# Admin frontend only
cd admin_frontend
npm ci && npm run lint && npm run build
```

## 🔒 Security

The pipeline includes:
- Trivy vulnerability scanning
- Dependency caching for faster builds
- Secure artifact handling

## 📈 Future Enhancements

Potential improvements (not implemented since deployment is excluded):
- Docker image building
- Integration tests with test databases
- Performance testing
- Code coverage reporting
- Automated semantic versioning
- Slack/Teams notifications