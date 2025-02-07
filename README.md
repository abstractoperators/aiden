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

## Devs

### Secrets

Locally, all secrets may be placed in their appropriate `.env` files. Reference and maintain the appropriate `.env.example`.

It is important to maintain example `.env` files for each environment. They are the source of insensitive secrets for github actions. However, only insensitive secrets may be placed in these example files.
Sensitive variables are stored in AWS Secrets Manager. Add sensitive variables, and update the appropriate task definition to load the secret into the container at runtime.