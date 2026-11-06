FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node app.js domain.js server.js init-db.js openapi.json ./
COPY --chown=node:node db ./db
COPY --chown=node:node public ./public
COPY --chown=node:node visual-tester ./visual-tester
ENV NODE_ENV=production PORT=3000
USER node
EXPOSE 3000
CMD ["node", "server.js"]
