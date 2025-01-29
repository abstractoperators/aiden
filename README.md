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

# install

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