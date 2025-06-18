#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs)
  echo "Loaded environment variables from .env.local file"
fi

# Export necessary environment variables
export NODE_OPTIONS=--no-node-snapshot
export ARGOCD_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJiYWNrc3RhZ2U6YXBpS2V5IiwibmJmIjoxNzQyMzc0MTU5LCJpYXQiOjE3NDIzNzQxNTksImp0aSI6IjE5MGNmMGYyLWY4YzMtNDQ2Yy04ZTRmLWNhODViYzgyYTdlNiJ9.lhmtn78DvGuGjLSkYYopUP3MPesH8svwaMixcwHuw9o

# Source nvm from common locations (try both common paths)
if [ -f "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
elif [ -f "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  source "/opt/homebrew/opt/nvm/nvm.sh"
elif [ -f "/usr/local/opt/nvm/nvm.sh" ]; then
  source "/usr/local/opt/nvm/nvm.sh"
fi

# Use Node.js version 20.14.0
nvm use v20.14.0 || { echo "Failed to switch to Node.js v20.14.0. Please make sure nvm is installed and this version is available."; exit 1; }

# Load environment variables from .env.local
# export $(grep -v '^#' .env.local | xargs)

# Install dependencies and start the application
yarn install
yarn tsc
yarn start
