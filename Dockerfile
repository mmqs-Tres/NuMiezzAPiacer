FROM node:20-slim

# Install pnpm and dos2unix
RUN npm install -g pnpm@9.1.0

# Install dependencies needed for native modules (like better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ dos2unix && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The entrypoint will execute from the mapped volume, fixing CRLF issues on Windows
ENTRYPOINT ["/bin/bash", "-c", "dos2unix /app/docker-entrypoint.sh && /bin/bash /app/docker-entrypoint.sh"]
