# Trippy - Travel Experience Booking Platform

[![CI Pipeline](https://github.com/Michelsim01/capstone_project/actions/workflows/ci.yml/badge.svg)](https://github.com/Michelsim01/capstone_project/actions/workflows/ci.yml)

A full-stack travel platform that connects travelers with local guides and unique experiences. Users can discover, book, and create travel experiences while guides can manage tours, track analytics, and communicate with travelers.

## Features

- **Experience Discovery**: Browse and search for unique travel experiences
- **Booking System**: Complete booking flow with Stripe payment integration
- **Guide Dashboard**: Tools for guides to create and manage tours
- **Real-time Messaging**: Communication between travelers and guides
- **Review System**: Rate and review completed experiences
- **Blog Platform**: Share travel stories and experiences
- **Analytics**: Revenue and booking analytics for guides
- **AI Chatbot**: Smart assistance for FAQ and itinerary planning
- **Mobile Responsive**: Works seamlessly across all devices

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

### 2. Configuration Setup

You'll need to obtain API keys from the following services:
- **Stripe** (for payments) - Get test keys from [stripe.com](https://stripe.com)
- **Mapbox** (for maps) - Get token from [mapbox.com](https://mapbox.com) 
- **OpenAI** (for chatbot) - Get API key from [openai.com](https://openai.com)

**Backend Configuration**: Create `backend/src/main/resources/application.properties`:

```properties
# Server Configuration
spring.application.name=spring-boot
server.port=8080
server.address=0.0.0.0

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5332/appdb
spring.datasource.username=app
spring.datasource.password=secret
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT Configuration
jwt.secret=your-secure-jwt-secret-key-here
jwt.expiration=86400000
jwt.prefix=Bearer 

# Email Configuration (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# API Keys (replace with your own)
stripe.api.secret-key=your-stripe-secret-key
stripe.api.publishable-key=your-stripe-publishable-key
mapbox.api.access-token=your-mapbox-token
openai.api.key=your-openai-api-key
openai.model.embedding=text-embedding-3-small
openai.model.chat=gpt-3.5-turbo

# Chatbot Configuration
chatbot.max.context.length=10
chatbot.similarity.threshold=0.7
chatbot.max.results=5
```

**Frontend Configuration**: Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_STRIPE_PUBLIC_KEY=your-stripe-publishable-key
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token
```

⚠️ **Important**: Never commit the configuration files containing your API keys to version control. They should be in your `.gitignore`.

### 3. Docker Environment Setup

Create a `.env` file in the root directory for Docker Compose:

```env
# Airflow Configuration
AIRFLOW_FERNET_KEY=your-32-character-fernet-key
AIRFLOW_WEBSERVER_SECRET_KEY=your-secret-key
AIRFLOW_UID=1000

# API Keys
OPENAI_API_KEY=your-openai-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. Start Services with Docker Compose

From the **root directory**, start all services (database, Airflow):

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** (port 5332) - Application database
  - Database: appdb
  - Username: app
  - Password: secret
- **Airflow Webserver** (port 8081) - Data pipeline UI
- **Airflow Scheduler** - DAG execution engine

Check that all services are healthy:
```bash
docker-compose ps
```

### 5. Run the Backend
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

### 6. Run the Frontend
Open a new terminal, navigate to the frontend directory:
```bash
cd frontend
npm install  # Only needed first time
npm run dev
```
The frontend will start on http://localhost:5173

### 7. Access Airflow (Optional - for Data Pipeline)

Airflow UI will be available at http://localhost:8081

- **Username**: `admin`
- **Password**: `admin`

See [data-pipeline/README.md](data-pipeline/README.md) for more details on configuring and using Airflow.

### Verify Everything Works

- Database is running: `docker ps` should show postgres-spring and airflow containers
- Backend is running: http://localhost:8080
- Frontend is running: http://localhost:5173
- Airflow is running: http://localhost:8081



