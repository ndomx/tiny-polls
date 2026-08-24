FROM ghcr.io/nubjs/nub:0.7.5

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
RUN nub ci

COPY --chown=node:node . .
RUN nub run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

CMD ["nub", "run", "start"]
