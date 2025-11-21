# POLLNOW

## Descripción General

POLLNOW es una aplicación web Full-Stack que permite la creación y gestión de certámenes de premios. A diferencia de las herramientas de encuestas convencionales, POLLNOW estructura la experiencia en fases temporales definidas (Votación y Gala), asegurando la integridad de los resultados hasta una fecha específica.

La aplicación prioriza la experiencia de usuario (UX) mediante un flujo de votación continuo y un diseño minimalista en modo oscuro, garantizando al mismo tiempo el anonimato técnico de los votantes sin requerir registro de usuarios.

## Arquitectura y Stack Tecnológico

El proyecto está construido sobre una arquitectura moderna orientada a Serverless y renderizado en servidor (SSR).

* **Framework:** Next.js 16 (App Router)
* **Lenguaje:** TypeScript
* **Base de Datos:** PostgreSQL
* **ORM:** Prisma
* **Estilos:** Tailwind CSS
* **Infraestructura:** Vercel (Soporte para Edge Middleware)

### Modelo de Datos

El sistema utiliza un modelo relacional que separa a los participantes de las encuestas, permitiendo la reutilización de entidades.

* **Participant:** Entidad recurrente (el individuo susceptible de ser votado).
* **Poll:** La categoría de votación.
* **Option:** Tabla de relación que vincula un `Participant` con una `Poll` específica.
* **Vote:** Registro de participación. Incluye un hash de identidad para prevenir duplicidad.

## Funcionalidades Principales

1.  **Votación Anónima Persistente:**
    Utiliza un sistema de identificación basado en cookies `HttpOnly` firmadas y hashes en base de datos (`voterHash`). Esto impide votos múltiples por dispositivo/sesión sin necesidad de autenticación tradicional (email/password).

2.  **Control Temporal (Anti-Spoiler):**
    Las rutas de resultados (`/results`) implementan una validación de fecha contra la variable global `GALA_DATE`. Si la fecha actual es anterior al evento, el servidor bloquea el acceso a los datos y muestra una cuenta regresiva.

3.  **Panel de Administración Seguro:**
    CMS integrado en la ruta `/admin`. El acceso está restringido a nivel de red mediante un Middleware que verifica la dirección IP del cliente contra una lista blanca (`ALLOWED_IP`).

4.  **Flujo Lineal:**
    La navegación guía al usuario secuencialmente desde la primera categoría hasta la finalización, maximizando la tasa de participación completa.

## Instalación y Configuración Local

Siga estos pasos para desplegar el entorno de desarrollo.

### Requisitos
* Node.js 18 o superior.
* Acceso a una instancia de PostgreSQL.

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd friend-of-the-year
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configuración de Entorno:**
    Cree un archivo `.env` en la raíz del proyecto basándose en el ejemplo provisto.
    ```env
    DATABASE_URL="postgresql://usuario:password@host:5432/database"
    ```

4.  **Inicialización de Base de Datos:**
    Ejecute las migraciones y el script de semilla (seed) para poblar la base de datos con datos iniciales.
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Ejecución:**
    ```bash
    npm run dev

    o

    npx dotenv -e .env -- npm run dev
    ```

## Guía de Despliegue (Producción)

Esta aplicación está optimizada para su despliegue en Vercel.

1.  Importe el repositorio en Vercel.
2.  Configure la variable de entorno `DATABASE_URL`.
3.  **Configuración de Build:** Es crítico sobrescribir el comando de construcción predeterminado para asegurar la generación del cliente Prisma antes de la compilación de Next.js.

**Build Command:**

```bash
npx prisma generate && npx prisma migrate deploy && next build
```

## Estructura del Proyecto

```text
src/
├── app/
│   ├── admin/           # Panel de control (protegido por IP)
│   ├── api/             # Endpoints REST (voto, resultados)
│   ├── polls/           # Vistas públicas de votación
│   └── results/         # Vistas de resultados (protegidas por fecha)
├── components/          # Componentes UI reutilizables
├── lib/                 # Lógica de negocio y configuración (Prisma, Config)
└── middleware.ts        # Lógica de seguridad y gestión de sesiones
```

---

POLLNOW es una plataforma de votación anónima y gestión de eventos diseñada para celebrar los momentos, los memes y las leyendas. Con una arquitectura moderna y un enfoque en la seguridad y la privacidad, POLLNOW permite a los usuarios crear, gestionar y participar en eventos de votación social.

## Features
- **Votación Anónima:** Permite votar sin necesidad de registro, utilizando cookies y hashes para prevenir votos duplicados.
- **Control Temporal:** Implementa un sistema de control temporal para asegurar que los resultados no se revelen antes de tiempo.
- **Panel de Administración:** Herramientas avanzadas para gestionar participantes y encuestas.
- **Seguridad y Privacidad:** Utiliza técnicas avanzadas para proteger la privacidad de los votantes y los organizadores de eventos.
- **Integración con Stripe:** Procesa pagos y suscripciones de manera segura y eficiente.

## Tech Stack
- **Programming Language:** TypeScript
- **Frameworks, Libraries, and Tools:**
  - Next.js
  - Prisma
  - Tailwind CSS
  - Framer Motion
  - Stripe
  - Zod
  - Date-fns
  - Canvas-confetti
  - Lucide-react
  - React
  - React-dom
  - Resend
  - Tailwind-merge
  - Use-debounce
  - Bcryptjs
  - Jest
  - ESLint
  - TypeScript

## Installation

### Prerequisites
- Node.js 18 o superior
- PostgreSQL

### Quick Start
```bash
# Clonar el repositorio
git clone <URL_del_repositorio>

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar la base de datos
npm run db:reset

# Iniciar el servidor
npm run dev
```

### Alternative Installation Methods
- **Docker:** [Instrucciones de Docker](https://github.com/user/your-repo/blob/main/Dockerfile)
- **Package Managers:** [Instrucciones de Package Managers](https://github.com/user/your-repo/blob/main/package.json)

## Usage

### Basic Usage
```typescript
// Ejemplo de uso básico
import { createEvent } from "@/app/lib/dashboard-actions";

const formData = new FormData();
formData.append('title', 'Mi Evento');
formData.append('description', 'Descripción del evento');

createEvent(formData)
  .then((res) => {
    if (res.success) {
      console.log('Evento creado con éxito');
    } else {
      console.error('Error al crear el evento');
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
```


## Technical Documentation

### Architecture Overview

The `POLLNOW` project is a full-stack web application built using modern technologies and frameworks. The architecture is designed to be scalable, secure, and user-friendly. The primary components of the architecture include:

- **Frontend:** Built using Next.js 16 with React and TypeScript.
- **Backend:** Utilizes Node.js with Express and Next.js API routes.
- **Database:** PostgreSQL with Prisma as the ORM.
- **Authentication:** NextAuth.js for handling user authentication.
- **Styling:** Tailwind CSS for styling the application.
- **Deployment:** Vercel for hosting and edge middleware support.

### Setup & Installation

To set up and install the project, follow these steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/user-attachments/assets/dbb8b9c7-f4cd-4e85-a1b7-07bb7a54937b
   cd POLLNOW
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**
   Create a `.env` file in the root directory and add the following environment variables:
   ```env
   DATABASE_URL=your_database_url
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   ...
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

### API Documentation

The project includes several API endpoints for various functionalities. Below is a brief overview of the main API endpoints:

- **Authentication:**
  - `POST /api/auth/[...nextauth]`: Handles user authentication using NextAuth.js.

- **Polls:**
  - `POST /api/polls`: Creates a new poll.
  - `GET /api/polls/[id]`: Retrieves a specific poll by ID.
  - `POST /api/polls/[id]/vote`: Casts a vote for a specific poll.
  - `GET /api/polls/[id]/results`: Retrieves the results of a specific poll.

- **Webhooks:**
  - `POST /api/webhooks/stripe`: Handles Stripe webhooks for payment processing.

### Database Schema

The project uses Prisma to interact with the PostgreSQL database. The main entities and their relationships are as follows:

- **Participant:** Represents a participant in the polls.
- **Poll:** Represents a poll or category.
- **Option:** Represents an option within a poll.
- **Vote:** Represents a vote cast by a participant.

### Configuration

The project uses several configuration files to manage settings and environment variables. Key configuration files include:

- **`next.config.ts`:** Configuration for Next.js, including image settings and custom server configurations.
- **`prisma.config.ts`:** Configuration for Prisma, including database connection settings.
- **`tsconfig.json`:** TypeScript configuration for the project.

### Development Guidelines

To ensure a smooth development experience, follow these guidelines:

- **Code Style:** Follow the project's code style guidelines, which are based on Airbnb's JavaScript style guide.
- **Testing:** Write unit tests for your components and API routes using Jest and React Testing Library.
- **Linting:** Use ESLint to lint your code and ensure it adheres to the project's style guidelines.
- **Version Control:** Use Git for version control and follow the project's branching strategy.

### Deployment Instructions

To deploy the project, follow these steps:

1. **Build the Project:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   - Push the code to your GitHub repository.
   - Connect your GitHub repository to Vercel.
   - Deploy the project using Vercel's deployment settings.

3. **Environment Variables:**
   - Set the necessary environment variables in the Vercel dashboard.

4. **Monitoring and Logging:**
   - Use Vercel's monitoring and logging tools to monitor the application's performance and troubleshoot any issues.

By following these guidelines, you can effectively set up, develop, and deploy the `POLLNOW` project.


---

## Business Requirements Document

### 1. Executive Summary
- **Project Overview:** The "POLLNOW" project is a web application designed to facilitate anonymous voting and event management for groups. The application is built using modern web technologies and follows a serverless architecture.
- **Business Objectives:** The primary goal is to create a platform that allows users to create and manage events, with a focus on ensuring the integrity and anonymity of the voting process.
- **Expected Outcomes:** The application aims to provide a seamless user experience, with features such as anonymous voting, control over voting periods, and a minimalistic dark mode design.

### 2. Project Scope
- **In-scope Features and Functionalities:**
  - Anonymous voting system
  - Event creation and management
  - Control over voting periods
  - Dark mode design
  - Integration with third-party services (e.g., Stripe for payments)
- **Out-of-scope Items:**
  - Advanced analytics and reporting
  - Mobile application
  - Social media integration
- **Key Assumptions:**
  - Users have basic knowledge of web applications
  - Users will have access to a stable internet connection

### 3. Business Requirements
- **Functional Requirements:**
  - **Anonymous Voting:** Users should be able to vote anonymously without requiring registration.
  - **Event Creation:** Users should be able to create events with specific voting periods.
  - **Event Management:** Users should be able to manage events, including adding participants and polls.
  - **Dark Mode:** The application should have a dark mode design for better user experience.
  - **Integration with Stripe:** The application should integrate with Stripe for handling payments.
- **Non-functional Requirements:**
  - **Performance:** The application should load quickly and handle a large number of concurrent users.
  - **Security:** The application should ensure the security and privacy of user data.
  - **Usability:** The application should be easy to use and navigate.
- **User Stories:**
  - **As a user, I want to create an event so that I can manage my friends' voting.**
  - **As a user, I want to vote anonymously so that my votes are not traced.**
  - **As a user, I want to see the results of the voting so that I can know the winner.**

### 4. Technical Architecture Overview
- **High-level System Architecture:**
  - **Frontend:** Built using Next.js with React and TypeScript.
  - **Backend:** Built using Node.js with Express and TypeScript.
  - **Database:** PostgreSQL with Prisma ORM.
  - **Authentication:** NextAuth.js for handling user authentication.
  - **Payment Processing:** Stripe for handling payments.
- **Technology Stack:**
  - **Frontend:** React, Next.js, TypeScript, Tailwind CSS
  - **Backend:** Node.js, Express, TypeScript
  - **Database:** PostgreSQL, Prisma
  - **Authentication:** NextAuth.js
  - **Payment Processing:** Stripe
- **Integration Points:**
  - **APIs:** RESTful APIs for communication between frontend and backend.
  - **Webhooks:** Stripe webhooks for handling payment events.

### 5. User Personas & Use Cases
- **Target Users:**
  - **Event Organizers:** Users who create and manage events.
  - **Voters:** Users who participate in the voting process.
- **Primary Use Cases:**
  - **Event Creation:** Users create events with specific voting periods.
  - **Anonymous Voting:** Users vote anonymously in the created events.
  - **Event Management:** Users manage events, including adding participants and polls.
- **User Journey Flows:**
  - **Event Creation:** User logs in, creates an event, sets voting periods, and adds participants.
  - **Anonymous Voting:** User navigates to the event, votes anonymously, and sees the results.
  - **Event Management:** User manages events, including adding participants and polls, and views statistics.

### 6. Success Criteria
- **Key Performance Indicators:**
  - **User Engagement:** Number of active users and events created.
  - **Voting Participation:** Number of votes cast per event.
  - **Event Management:** Number of events managed by users.
- **Acceptance Criteria:**
  - **Anonymous Voting:** Users can vote anonymously without registration.
  - **Event Creation:** Users can create events with specific voting periods.
  - **Event Management:** Users can manage events, including adding participants and polls.
- **Business Value Metrics:**
  - **Revenue:** Revenue generated from premium subscriptions.
  - **User Retention:** Number of returning users.
  - **User Satisfaction:** Feedback from users on the application's usability and features.

### 7. Implementation Timeline
- **High-level Milestones:**
  - **Phase 1: Planning and Design (2 weeks)**
    - Define project scope and requirements.
    - Design the architecture and user interface.
  - **Phase 2: Development (8 weeks)**
    - Develop the frontend and backend.
    - Implement the anonymous voting system.
    - Integrate with Stripe for payment processing.
  - **Phase 3: Testing and Quality Assurance (2 weeks)**
    - Conduct unit and integration testing.
    - Perform user acceptance testing.
  - **Phase 4: Deployment and Launch (1 week)**
    - Deploy the application to production.
    - Monitor and optimize performance.
- **Dependencies:**
  - **Third-party Services:** Stripe for payment processing.
  - **Database:** PostgreSQL with Prisma ORM.
- **Risk Considerations:**
  - **Security Risks:** Ensure the security and privacy of user data.
  - **Performance Risks:** Optimize the application for performance and scalability.
  - **Integration Risks:** Ensure smooth integration with third-party services.

This Business Requirements Document outlines the key aspects of the "POLLNOW" project, focusing on business value and user needs.