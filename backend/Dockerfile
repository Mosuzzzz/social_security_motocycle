# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM rust:1.85-slim AS builder

# Install system dependencies needed for Diesel + PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first for better layer caching
COPY Cargo.toml Cargo.lock ./

# Create a dummy main to pre-compile dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release 2>/dev/null || true
RUN rm -f src/main.rs

# Copy actual source code
COPY src ./src

# Touch main.rs to force re-compile of our code (not deps)
RUN touch src/main.rs
RUN cargo build --release

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/target/release/backend ./backend

# Expose the port (Railway will set $PORT automatically)
EXPOSE 8000

CMD ["./backend"]
