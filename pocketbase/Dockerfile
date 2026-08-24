FROM alpine:3.20

ARG PB_VERSION=0.39.10
ARG TARGETARCH=amd64

WORKDIR /pb

RUN apk add --no-cache ca-certificates unzip wget \
  && wget -O /tmp/pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" \
  && unzip /tmp/pocketbase.zip -d /pb \
  && chmod +x /pb/pocketbase \
  && rm /tmp/pocketbase.zip

COPY pb_migrations ./pb_migrations
COPY start.sh ./start.sh

RUN chmod +x /pb/start.sh

EXPOSE 8090

CMD ["./start.sh"]
