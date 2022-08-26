FROM denoland/deno
WORKDIR /app
USER deno
COPY . .
RUN deno cache main.ts
CMD ["run", "--allow-env", "--allow-net", "--allow-read", "main.ts"]
