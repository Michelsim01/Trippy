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
Stay in the backend directory and run:
```bash
# On macOS/Linux
./mvnw spring-boot:run

# On Windows
mvnw.cmd spring-boot:run
```
- The backend will start on http://localhost:8080
- Test the API: http://localhost:8080/api/hello

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
- Backend is running: http://localhost:8080/api/hello returns a message
- Frontend is running: http://localhost:3000 loads React app
