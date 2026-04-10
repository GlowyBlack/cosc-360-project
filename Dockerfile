# Book Buddy — run from the repository root:
#   docker compose up --build
#
# Service images are built from:
#   ./server/Dockerfile
#   ./book-buddy/Dockerfile
#
FROM node:20-alpine
WORKDIR /
RUN printf '%s\n' \
  "Use: docker compose up --build" \
  "See docker-compose.yml (mongo, server, client)." \
  > /DOCKER-README.txt
CMD ["cat", "/DOCKER-README.txt"]
