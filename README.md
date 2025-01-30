# aiden

Install `pnpm` and `node`
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Install Node
nvm install 23

# Verify the Node.js version: Should be the same
node -v
nvm current

# Verify node package manager version (npm)
npm -v 

npm install -g pnpm@latest-10

```

## eliza

```bash
git submodule update --init --recursive --depth 1 

# To update commit on eliza
cd eliza
git pull origin main
git checkout # git checkout $(git describe --tags --abbrev=0) for latest release
cd ..
git add eliza
git commit
```

## Secrets

Eve needs secrets to run.
Locally, all secrets may be placed in `.env.eve`. Reference (and update) `.env.eve.example` to find required secrets.

When deployed, only insensitive secrets may be placed in `.env.eve`. 
Add insensitive variables in the deployment pipeline `.github/workflows/deploy-eve-to-staging.yaml`
Sensitive variables are stored in AWS Secrets Manager. Update eve's task definition to load these secrets from AWS Secrets Manager.

