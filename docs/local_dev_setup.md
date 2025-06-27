# Local Development Setup

This guide covers running the application locally for development purposes.

## Quick Start Checklist

**Prerequisites:**

- □ Node.js installed
- □ Access to 1Password/AWS Systems Manager
- □ Dynamic.xyz account
- □ Team access for bearer token

**Setup Steps (~10-15 minutes):**

- □ Clone aiden repository
- □ Copy `.env.api.example` → `.env.api`
- □ Copy `.env.local.example` → `.env.local`
- □ Get `POSTGRES_DB_PASSWORD` from 1Password/AWSSM
- □ Get `DYNAMIC_ENVIRONMENT_ID` from dynamic.xyz dashboard
- □ Generate `AUTH_SECRET` using Auth.js guide
- □ Get `NEXT_DYNAMIC_BEARER_TOKEN` loaded in at runtime. Locally, loaded through docker-compose. On AWS, through task definition + secrets manager.
- □ Set `API_ENDPOINT=https://api.staigen.space` in `.env.local`
- □ Run `make run-api-nodocker`
- □ Run `make run-frontend-nodocker`
- □ Test: Visit localhost:3000 and localhost:8003
- □ Verify: Can view/manage runtimes

## Prerequisites

- Access to 1Password/AWS Systems Manager for credentials
- Access to staging database
- Node.js and Docker installed (for Docker setup)

## Environment Configuration

### Backend Setup

1. **Create Backend Environment File**

   ```bash
   cp .env.api.example .env.api
   ```

2. **Configure Backend Variables**
   Update `.env.api` with the following:

   ```env
   POSTGRES_DB_PASSWORD=<value_from_1Password_or_AWSSM>
   ENV=staging
   DYNAMIC_ENVIRONMENT_ID=<your_dynamic_environment_id>
   ```

   **Where to find values:**

   - `POSTGRES_DB_PASSWORD`: Retrieve from 1Password or AWS Systems Manager
   - `DYNAMIC_ENVIRONMENT_ID`: Found at the top of your dashboard after logging into your [dynamic.xyz](https://dynamic.xyz) account

   > **Note:** Local database with mock data is not available yet. The local backend connects to the staging database using these environment variables.

### Frontend Setup

1. **Create Frontend Environment File**

   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure Frontend Variables**
   Update `.env.local` with the following:

   ```env
   API_ENDPOINT=https://api.staigen.space
   NEXT_DYNAMIC_BEARER_TOKEN=<your_bearer_token>
   AUTH_SECRET=<your_auth_secret>
   AUTH_URL=http://localhost:3000
   NEXT_SEI_NET=test
   ```

   > **Important:** Set `API_ENDPOINT=https://api.staigen.space` because the local backend lacks AWS runtime management permissions.

   **Where to find values:**

   - `NEXT_DYNAMIC_BEARER_TOKEN`: Check with your team or existing staging environment
   - `AUTH_SECRET`: Generate using the guidance in `.env.local.example` or follow the [Auth.js installation guide](https://authjs.dev/getting-started/installation?framework=next-js)

## Running the Application

### Non-Docker Setup (Recommended)

From the root directory of the `aiden` repository:

1. **Start Backend**

   ```bash
   make run-api-nodocker
   ```

   Backend will be available at: `http://localhost:8003`

2. **Start Frontend**
   ```bash
   make run-frontend-nodocker
   ```
   Frontend will be available at: `http://localhost:3000`

### Docker Setup (Alternative)

You can also run using Docker containers:

1. **Start Backend with Docker**

   ```bash
   make run-api
   ```

2. **Start Frontend with Docker**
   ```bash
   make run-frontend
   ```

> **Note:** When using Docker, ensure environment variables are configured appropriately as specified in the example files.

## Access Points

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8003](http://localhost:8003)

## Runtime Management

For runtime-related operations, the local setup uses the staging API endpoint (`https://api.staigen.space`) since the local backend doesn't have AWS permissions for runtime management.
