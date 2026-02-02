# syntax=docker/dockerfile:1

FROM node:lts-alpine AS build
WORKDIR /movinin

# Install backend deps (including dev deps needed for build)
COPY ./backend/package*.json ./backend/
RUN cd /movinin/backend && npm ci

# Install package deps needed for project references
COPY ./packages/movinin-types/package*.json ./packages/movinin-types/
RUN cd /movinin/packages/movinin-types && npm ci

# Copy sources and build
COPY ./backend ./backend
COPY ./packages/movinin-types ./packages/movinin-types
RUN cd /movinin/backend && npm run build

FROM node:lts-alpine
WORKDIR /movinin/backend

ENV NODE_ENV=production

COPY --from=build /movinin/backend/package*.json ./
COPY --from=build /movinin/backend/node_modules ./node_modules
COPY --from=build /movinin/backend/dist ./dist
COPY --from=build /movinin/packages/movinin-types /movinin/packages/movinin-types

EXPOSE 4004
CMD ["node", "--import", "./dist/src/monitoring/instrument.js", "dist/src"]
