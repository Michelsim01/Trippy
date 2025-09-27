# Capstone Project - Full Stack Application

A full-stack web application built with React (frontend) and Spring Boot (backend) with PostgreSQL database.

## Tech Stack

### Frontend
- React
- Node.js / npm

### Backend
- Spring Boot 3.5.5
- Java 17
- Maven
- Spring Data JPA
- PostgreSQL 16

### Infrastructure
- Docker & Docker Compose (for PostgreSQL)

## Prerequisites

Before running this project, ensure you have the following installed:

- **Java 17** or higher
- **Node.js** (v16 or higher) and npm
- **Docker** and **Docker Compose**
- **Git**

### Prerequisites Installation

1. **Install Java 17**
    - macOS: `brew install openjdk@17`
    - Windows: Download from [Oracle](https://www.oracle.com/java/technologies/downloads/#java17) or [Adoptium](https://adoptium.net/)
    - Linux: `sudo apt install openjdk-17-jdk`
    - Verify: `java -version`
2. **Install Node.js and npm**
    - Download from [nodejs.org](https://nodejs.org/) (LTS version)
    - Verify: `node -v` and `npm -v`
3. **Install Docker Desktop**
    - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
    - Start Docker Desktop after installation
    - Verify: `docker --version` and `docker-compose --version`
      

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd capstone_project
```

After cloning the repository, create your local configuration file:
1. Create a file in backend/src/main/resources called 'application.properties'. This file should not be committed to version control as it contains environment-specific configuration and potentially sensitive data like database passwords and API keys. To create the file, run these commands in order:
```bash
# Make sure you are in the capstone_project directory
mkdir -p backend/src/main/resources
touch backend/src/main/resources/application.properties
```
3. Copy and paste this code in.
```bash
# application.properties (DEV)
spring.application.name=spring-boot

# Server configuration - bind to all interfaces to allow external access
server.port=8080
server.address=0.0.0.0

# JDBC points to the HOST port you mapped in docker-compose 
spring.datasource.url=jdbc:postgresql://localhost:5332/appdb
spring.datasource.username=app
spring.datasource.password=secret
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# JWT Configuration
jwt.secret=trippy-secret-key-2024-very-long-and-secure-key-for-jwt-token-generation
jwt.expiration=86400000
jwt.prefix=Bearer 

# Email Configuration (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=Michelsim2002@gmail.com
spring.mail.password=orroajxbyuaxjodl
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.ssl.trust=smtp.gmail.com

# Email Templates
spring.mail.templates.path=classpath:/templates/email/

# Stripe Configuration
stripe.api.secret-key=sk_test_51SASx4PPgLxRpMEFgG9lqCXpgBxIqBquMKF6hGsbpk8RazH7G6ZcpcaP2rF75jvF4MI9VEnQCu1xaqFppIQen7J100EuR3LCRC
stripe.api.publishable-key=pk_test_51SASx4PPgLxRpMEFg4PZJPwab4EIxU6N3XcsGGJ10XRPKrm9Kgox1eP7KouzNVqFcNXSuxDsA5q8v3vmx0A9CAUD00BZwXkd6s
```

4. Create a `.env` file in the frontend directory (`frontend/.env`):

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8080

# Stripe Configuration (Test Mode)
VITE_STRIPE_PUBLIC_KEY=pk_test_51SASx4PPgLxRpMEFg4PZJPwab4EIxU6N3XcsGGJ10XRPKrm9Kgox1eP7KouzNVqFcNXSuxDsA5q8v3vmx0A9CAUD00BZwXkd6s
```

### 2. Start the Database
Navigate to the backend directory and start PostgreSQL using Docker Compose:
```bash
cd backend
docker-compose up -d
```
This will start PostgreSQL on port 5332 with:

- Database: appdb
- Username: app
- Password: secret

### 3. Run the Backend
Seed the data:
```bash
cd backend
./seed-database.sh
```

Stay in the backend directory and run:
```bash
# On macOS/Linux
./mvnw spring-boot:run

# On Windows
mvnw.cmd spring-boot:run
```

### 4. Run the Frontend
Open a new terminal, navigate to the frontend directory:
```bash
cd frontend
npm install  # Only needed first time
npm run dev
```
The frontend will start on http://localhost:3000

### Verify Everything Works

- Database is running: docker ps should show postgres-spring container
- Backend is running
- Frontend is running

## Testing Payment Integration

The application uses Stripe in test mode for payment processing. Use the following test card numbers to simulate different payment scenarios:

### Successful Payment Test Cards

- **Visa** → `4242 4242 4242 4242`
- **Mastercard** → `5555 5555 5555 4444`
- **American Express** → `3782 822463 10005`

### Error Simulation Test Cards

- **Declined card** → `4000 0000 0000 0002`
- **Insufficient funds** → `4000 0000 0000 9995`
- **Incorrect CVC** → `4000 0000 0000 0127`
- **Expired card** → `4000 0000 0000 0069`
- **Processing error** → `4000 0000 0000 0119`

**Note:** For all test cards, you can use any future expiration date and any 3-digit CVC code.


