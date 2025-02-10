FROM ubuntu:latest AS build-env

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

RUN curl -o zig.tar.xz https://ziglang.org/download/0.11.0/zig-linux-x86_64-0.11.0.tar.xz && \
     tar -xf zig.tar.xz && \
     mv zig-linux-x86_64-0.11.0 zig && \
     rm zig.tar.xz
ENV PATH="/zig:$PATH"

RUN apt-get install -y --no-install-recommends cargo && \
    cargo install hyperfine --version 1.18.0 && \
    rm -rf /var/lib/apt/lists/* /root/.cargo/registry

WORKDIR /app

COPY . .

RUN bun install

FROM ubuntu:latest AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build-env /app /app
COPY --from=build-env /root/.bun /root/.bun
COPY --from=build-env /root/.cargo/bin/hyperfine /usr/local/bin/hyperfine
COPY --from=build-env /zig /zig


WORKDIR /app
ENV PATH="/root/.bun/bin:/zig:${PATH}"

ENTRYPOINT ["/bin/bash", "/app/bench.sh"]
