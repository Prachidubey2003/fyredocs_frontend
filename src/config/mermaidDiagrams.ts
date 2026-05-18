export const mermaidDiagrams: Record<
  string,
  { heading: string; content: string }[]
> = {
  architecture: [
    {
      heading: 'Service Topology',
      content: `graph TB
    subgraph Clients
        WebApp["Web Application<br/>(React / SPA)"]
        CLI["CLI / API Consumer"]
    end

    subgraph Gateway["API Gateway :8080"]
        GW["api-gateway<br/>net/http reverse proxy"]
    end

    subgraph Core["Core Services"]
        AUTH["auth-service :8086<br/>Gin"]
        JOB["job-service :8081<br/>Gin"]
    end

    subgraph Workers["Worker Services (NATS consumers)"]
        CFP["convert-from-pdf :8082<br/>Gin + NATS worker"]
        CTP["convert-to-pdf :8083<br/>Gin + NATS worker"]
        ORG["organize-pdf :8084<br/>Gin + NATS worker"]
        OPT["optimize-pdf :8085<br/>Gin + NATS worker"]
    end

    subgraph Analytics["Analytics"]
        AN["analytics-service :8087<br/>Gin + NATS consumer"]
    end

    subgraph Background
        CW["cleanup-worker<br/>Ticker-based"]
    end

    subgraph Infrastructure
        PG[(PostgreSQL)]
        RD[(Redis)]
        NATS["NATS JetStream"]
    end

    WebApp -->|HTTPS| GW
    CLI -->|HTTPS| GW

    GW -->|/auth/*| AUTH
    GW -->|/api/*| JOB
    GW -->|/admin/*| AN

    JOB -->|jobs.dispatch.*| NATS
    NATS -->|jobs.dispatch.convert-from-pdf| CFP
    NATS -->|jobs.dispatch.convert-to-pdf| CTP
    NATS -->|jobs.dispatch.organize-pdf| ORG
    NATS -->|jobs.dispatch.optimize-pdf| OPT

    AUTH --> PG
    AUTH --> RD
    JOB --> PG
    JOB --> RD
    JOB --> NATS
    CFP --> PG
    CFP --> RD
    CTP --> PG
    CTP --> RD
    ORG --> PG
    ORG --> RD
    OPT --> PG
    OPT --> RD
    AN --> PG
    AN --> NATS
    AUTH -->|analytics events| NATS
    JOB -->|analytics events| NATS
    CW --> PG
    CW --> RD
    GW --> RD`,
    },
    {
      heading: 'Data Flow Overview',
      content: `flowchart LR
    subgraph Upload
        A[Client] -->|1. Init upload| B[job-service]
        A -->|2. Upload chunks| B
        A -->|3. Complete upload| B
        B -->|Store state| Redis[(Redis)]
        B -->|Save chunks| Disk[(File System)]
    end

    subgraph Processing
        A -->|4. Create job| B
        B -->|5. Save job record| PG[(PostgreSQL)]
        B -->|6. Publish event| NATS["NATS JetStream<br/>JOBS_DISPATCH"]
        NATS -->|7. Deliver message| W["Worker Service"]
        W -->|8. Process file| W
        W -->|9. Update status| PG
    end

    subgraph Retrieval
        A -->|10. Poll job status| B
        B -->|Read job| PG
        A -->|11. Download result| B
        B -->|Read file| Disk
    end`,
    },
    {
      heading: 'NATS JetStream Streams',
      content: `graph LR
    subgraph JOBS_DISPATCH["JOBS_DISPATCH (WorkQueue)"]
        D1["jobs.dispatch.convert-from-pdf"]
        D2["jobs.dispatch.convert-to-pdf"]
        D3["jobs.dispatch.organize-pdf"]
        D4["jobs.dispatch.optimize-pdf"]
    end

    subgraph JOBS_EVENTS["JOBS_EVENTS (Interest)"]
        E1["jobs.events.completed"]
        E2["jobs.events.failed"]
    end

    JS[job-service] -->|Publish| D1
    JS -->|Publish| D2
    JS -->|Publish| D3
    JS -->|Publish| D4

    subgraph ANALYTICS_STREAM["ANALYTICS (Interest)"]
        A1["analytics.events.user.*"]
        A2["analytics.events.job.*"]
        A3["analytics.events.plan.*"]
    end

    D1 -->|Consume| CFP[convert-from-pdf]
    D2 -->|Consume| CTP[convert-to-pdf]
    D3 -->|Consume| ORG[organize-pdf]
    D4 -->|Consume| OPT[optimize-pdf]

    AUTH2[auth-service] -->|Publish| A1
    JS -->|Publish| A2
    JS -->|Publish| A3
    A1 -->|Consume| AN[analytics-service]
    A2 -->|Consume| AN
    A3 -->|Consume| AN
    E1 -->|Consume| AN
    E2 -->|Consume| AN`,
    },
    {
      heading: 'Authentication Flow',
      content: `flowchart TD
    Client -->|Request with JWT cookie or Bearer token| GW[api-gateway]
    GW -->|Verify JWT via HS256 secret| GW
    GW -->|Check token denylist| Redis[(Redis)]
    GW -->|Guest? Validate guest token| Redis
    GW -->|Set X-User-ID, X-Role headers| Backend[Backend Service]
    Backend -->|Trust gateway headers OR re-verify| Backend`,
    },
  ],
  'svc-api-gateway': [
    {
      heading: 'Component Diagram',
      content: `graph TB
    subgraph api-gateway[" api-gateway :8080 "]
        direction TB

        subgraph Middleware["Middleware Chain"]
            TRACE["OpenTelemetry<br/>Trace Middleware"]
            METRICS["Prometheus<br/>Metrics Middleware"]
            REQID["Request ID<br/>Middleware"]
            CORS["CORS<br/>Middleware"]
            AUTHMW["JWT Auth<br/>Middleware"]
        end

        subgraph Auth["Auth Verification"]
            VERIFIER["Verifier<br/>(HS256 JWT)"]
            DENYLIST["Token Denylist<br/>(Redis-backed)"]
            GUESTSTORE["Guest Store<br/>(Redis-backed)"]
        end

        subgraph Routing["Reverse Proxy Routing"]
            MUX["http.ServeMux"]
            PROXY_AUTH["/auth/* -> auth-service"]
            PROXY_UPLOAD["/api/upload/* -> job-service"]
            PROXY_CFP["/api/convert-from-pdf/* -> job-service"]
            PROXY_CTP["/api/convert-to-pdf/* -> job-service"]
            PROXY_ORG["/api/organize-pdf/* -> job-service"]
            PROXY_OPT["/api/optimize-pdf/* -> job-service"]
            PROXY_JOBS["/api/jobs/* -> job-service"]
        end

        HEALTH["/healthz endpoint"]
        METRICEP["/metrics endpoint"]
    end

    Client["Client"] --> TRACE --> METRICS --> REQID --> CORS --> AUTHMW --> MUX

    AUTHMW --> VERIFIER
    AUTHMW --> DENYLIST
    AUTHMW --> GUESTSTORE

    MUX --> PROXY_AUTH
    MUX --> PROXY_UPLOAD
    MUX --> PROXY_CFP
    MUX --> PROXY_CTP
    MUX --> PROXY_ORG
    MUX --> PROXY_OPT
    MUX --> PROXY_JOBS
    MUX --> HEALTH
    MUX --> METRICEP

    DENYLIST --> Redis[(Redis)]
    GUESTSTORE --> Redis
    HEALTH -->|Ping| Redis

    PROXY_AUTH --> AuthSvc["auth-service :8086"]
    PROXY_UPLOAD --> JobSvc["job-service :8081"]
    PROXY_CFP --> JobSvc
    PROXY_CTP --> JobSvc
    PROXY_ORG --> JobSvc
    PROXY_OPT --> JobSvc
    PROXY_JOBS --> JobSvc`,
    },
    {
      heading: 'Middleware Execution Order',
      content: `flowchart LR
    A["Incoming<br/>Request"] --> B["telemetry.<br/>HTTPTraceMiddleware"]
    B --> C["metrics.<br/>HTTPMetricsMiddleware"]
    C --> D["logger.<br/>HTTPRequestID"]
    D --> E["withCORS"]
    E --> F["authverify.<br/>HTTPAuthMiddleware"]
    F --> G["http.ServeMux<br/>(route match)"]
    G --> H["httputil.<br/>ReverseProxy"]
    H --> I["Backend<br/>Service"]`,
    },
    {
      heading: 'Dependency Graph',
      content: `graph LR
    GW[api-gateway] --> |shared/logger| Logger
    GW --> |shared/metrics| Metrics
    GW --> |shared/telemetry| Telemetry
    GW --> |internal/authverify| AuthVerify

    AuthVerify --> |go-redis/v9| Redis[(Redis)]
    AuthVerify --> |golang-jwt/jwt/v5| JWT

    GW --> |net/http/httputil| ReverseProxy
    GW --> |joho/godotenv| DotEnv`,
    },
    {
      heading: 'Authenticated Request to Job Service',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway :8080
    participant Redis
    participant JobSvc as job-service :8081

    Client->>GW: POST /api/convert-from-pdf/pdf-to-word<br/>(Cookie: access_token=<JWT>)

    Note over GW: Trace + Metrics + RequestID middleware

    Note over GW: CORS check<br/>Validate Origin against CORS_ALLOW_ORIGINS

    GW->>GW: Parse JWT (HS256)<br/>Extract userID, role, exp

    GW->>Redis: Check token denylist<br/>GET deny:<jti>
    Redis-->>GW: nil (not denied)

    Note over GW: AuthContext populated<br/>{UserID, Role, IsGuest: false}

    GW->>GW: Clear downstream auth headers<br/>Set X-User-ID, X-Role, X-Auth-Type

    GW->>JobSvc: POST /api/convert-from-pdf/pdf-to-word<br/>(X-User-ID: <uuid>, X-Role: user)

    JobSvc-->>GW: 201 Created {job}
    GW-->>Client: 201 Created {job}`,
    },
    {
      heading: 'Guest (Unauthenticated) Request',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway :8080
    participant Redis
    participant JobSvc as job-service :8081

    Client->>GW: POST /api/uploads/init<br/>(No auth header, X-Guest-Token: <token>)

    Note over GW: No Bearer token found

    GW->>Redis: Validate guest token<br/>EXISTS guest:<token>:jobs
    Redis-->>GW: 1 (valid)

    Note over GW: AuthContext populated<br/>{GuestToken, IsGuest: true}

    GW->>GW: Set X-Guest-Token header

    GW->>JobSvc: POST /api/uploads/init<br/>(X-Guest-Token: <token>)

    JobSvc-->>GW: 201 Created {uploadId}
    GW-->>Client: 201 Created {uploadId}`,
    },
    {
      heading: 'CORS Preflight',
      content: `sequenceDiagram
    participant Browser
    participant GW as api-gateway :8080

    Browser->>GW: OPTIONS /api/uploads/init<br/>Origin: https://app.fyredocs.com

    Note over GW: withCORS middleware

    GW->>GW: Check Origin against allowed list
    GW->>GW: Set Access-Control-Allow-Origin
    GW->>GW: Set Access-Control-Allow-Methods
    GW->>GW: Set Access-Control-Allow-Headers
    GW->>GW: Set Access-Control-Allow-Credentials

    GW-->>Browser: 204 No Content<br/>(CORS headers)`,
    },
    {
      heading: 'Health Check',
      content: `sequenceDiagram
    participant LB as Load Balancer
    participant GW as api-gateway :8080
    participant Redis

    LB->>GW: GET /healthz

    GW->>Redis: PING (2s timeout)
    Redis-->>GW: PONG

    GW-->>LB: 200 {"status": "healthy"}

    Note over GW: If Redis PING fails:

    GW->>Redis: PING (2s timeout)
    Redis-->>GW: timeout/error

    GW-->>LB: 503 {"status": "unhealthy", "redis": "..."}`,
    },
  ],
  'svc-auth': [
    {
      heading: 'Component Diagram',
      content: `graph TB
    subgraph auth-service[" auth-service :8086 "]
        direction TB

        subgraph Middleware["Middleware Chain (Gin)"]
            TRACE["OpenTelemetry<br/>GinTraceMiddleware"]
            METRICS["Prometheus<br/>GinMetricsMiddleware"]
            REQID["Request ID"]
            LOGGER["Request Logger"]
            AUTHMW["Auth Middleware<br/>(JWT + Guest)"]
        end

        subgraph Routes["Route Groups"]
            subgraph AuthRoutes["/auth"]
                SIGNUP["POST /signup"]
                LOGIN["POST /login"]
                REFRESH["POST /refresh<br/>(deprecated)"]
                ME["GET /me"]
                PROFILE["GET /profile"]
                LOGOUT["POST /logout"]
            end

            subgraph InternalRoutes["/internal"]
                USER_PLAN["GET /users/:id/plan"]
            end

            HEALTHZ["/healthz"]
            METRICSEP["/metrics"]
        end

        subgraph Handlers
            AH["AuthEndpoints<br/>(Signup, Login, Logout, Me, Profile)"]
            IH["Internal API<br/>(GetUserPlan)"]
        end

        subgraph Internal
            ISSUER["Token Issuer<br/>(HS256 JWT)"]
            VERIFIER["Auth Verifier<br/>(JWT validation)"]
            DENYLIST["Token Denylist<br/>(Redis-backed)"]
            GUESTSTORE["Guest Store<br/>(Redis-backed)"]
        end

        subgraph RateLimiting["Rate Limiting (Redis)"]
            RL_LOGIN["login: 5 req/min"]
            RL_SIGNUP["signup: 3 req/min"]
            RL_REFRESH["refresh: 10 req/min"]
        end

        subgraph Models["internal/models"]
            USER_MODEL["User model<br/>(id, email, password_hash,<br/>full_name, phone, country, image_url)"]
            DB_CONN["Database Connection<br/>(GORM + PostgreSQL)"]
        end
    end

    Client["api-gateway"] --> TRACE

    AuthRoutes --> AH
    InternalRoutes --> IH

    AH --> ISSUER
    AH --> DENYLIST
    AH --> DB_CONN
    IH --> DB_CONN

    DB_CONN --> PG[(PostgreSQL)]
    DENYLIST --> Redis[(Redis)]
    GUESTSTORE --> Redis
    RateLimiting --> Redis`,
    },
    {
      heading: 'Token Lifecycle',
      content: `stateDiagram-v2
    [*] --> Issued: POST /signup or POST /login
    Issued --> Active: Set in HttpOnly cookie
    Active --> Verified: api-gateway validates on each request
    Active --> Denied: POST /logout<br/>(added to denylist)
    Active --> Expired: TTL exceeded (8h default)
    Denied --> [*]: Rejected on next request
    Expired --> [*]: Rejected on next request`,
    },
    {
      heading: 'Password Security Flow',
      content: `flowchart TD
    A["User submits password"] --> B{"Length check"}
    B -->|< 8 chars| C["400: WEAK_PASSWORD"]
    B -->|> 128 chars| D["400: INVALID_INPUT"]
    B -->|8-128 chars| E["bcrypt.GenerateFromPassword<br/>(DefaultCost)"]
    E --> F["Store password_hash in PostgreSQL"]

    G["User logs in"] --> H["bcrypt.CompareHashAndPassword"]
    H -->|Match| I["Issue JWT access token"]
    H -->|No match| J["401: INVALID_CREDENTIALS"]`,
    },
    {
      heading: 'Dependency Graph',
      content: `graph LR
    AS[auth-service] --> |shared/config| Config
    AS --> |shared/logger| Logger
    AS --> |shared/metrics| Metrics
    AS --> |shared/telemetry| Telemetry
    AS --> |shared/response| Response

    AS --> |internal/authverify| AuthVerify
    AS --> |internal/models| Models
    AS --> |internal/token| TokenIssuer

    Models --> |gorm| PG[(PostgreSQL)]
    AuthVerify --> |go-redis/v9| Redis[(Redis)]
    AuthVerify --> |golang-jwt/jwt/v5| JWT
    AS --> |golang.org/x/crypto/bcrypt| BCrypt`,
    },
    {
      heading: 'User Signup',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway :8080
    participant AS as auth-service :8086
    participant Redis
    participant PG as PostgreSQL

    Client->>GW: POST /auth/signup<br/>{"email", "password", "fullName", "country"}

    GW->>GW: CORS check
    GW->>AS: POST /auth/signup<br/>(proxied)

    Note over AS: Rate limit: 3 req/min per IP

    AS->>AS: Validate inputs<br/>email required, password 8-128 chars,<br/>fullName required, country required

    AS->>AS: normalizeEmail(email)<br/>(lowercase + trim)

    AS->>PG: SELECT * FROM users WHERE email = ?
    PG-->>AS: ErrRecordNotFound (user does not exist)

    AS->>AS: bcrypt.GenerateFromPassword(password, DefaultCost)

    AS->>PG: INSERT INTO users<br/>(email, full_name, phone, country, image_url, password_hash)
    PG-->>AS: User created (with generated UUID)

    AS->>AS: Issuer.IssueAccessToken(userId, "user")<br/>Generate HS256 JWT

    AS->>AS: Set access_token cookie<br/>(HttpOnly, Secure, SameSite=Lax, MaxAge=8h)

    AS-->>GW: 200 {user: {id, email, fullName, role: "user"}}
    GW-->>Client: 200 + Set-Cookie: access_token=<jwt>`,
    },
    {
      heading: 'User Login',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway :8080
    participant AS as auth-service :8086
    participant PG as PostgreSQL

    Client->>GW: POST /auth/login<br/>{"email": "user@example.com", "password": "secret123"}

    GW->>AS: POST /auth/login

    Note over AS: Rate limit: 5 req/min per IP

    AS->>AS: normalizeEmail("user@example.com")
    AS->>AS: Validate: email not empty, password not empty, <= 128 chars

    AS->>PG: SELECT * FROM users WHERE email = ?
    PG-->>AS: User {id, email, password_hash, ...}

    AS->>AS: bcrypt.CompareHashAndPassword(hash, password)
    Note over AS: Password matches

    AS->>AS: Issuer.IssueAccessToken(userId, "user")
    AS->>AS: Set access_token cookie

    AS-->>GW: 200 {user: {id, email, fullName, role}}
    GW-->>Client: 200 + Set-Cookie: access_token=<jwt>`,
    },
    {
      heading: 'User Logout',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway :8080
    participant AS as auth-service :8086
    participant Redis

    Client->>GW: POST /auth/logout
    Note right of Client: Cookie: access_token=jwt

    GW->>GW: Verify JWT, populate auth context
    GW->>AS: POST /auth/logout
    Note right of GW: X-User-ID: uuid

    AS->>AS: Extract auth context
    AS->>AS: Verify user is authenticated
    AS->>AS: Extract access token from header or context
    AS->>AS: Parse token expiration (unverified)
    AS->>AS: Calculate remaining TTL

    AS->>Redis: SET deny:token_hash EX remaining_ttl
    Note over Redis: Token added to denylist

    AS->>AS: Clear access_token cookie
    Note right of AS: Set-Cookie expires immediately

    AS-->>GW: 204 No Content
    GW-->>Client: 204 No Content
    Note right of GW: Set-Cookie clears access_token`,
    },
    {
      heading: 'Get Current User (Me)',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway :8080
    participant AS as auth-service :8086
    participant PG as PostgreSQL

    Client->>GW: GET /auth/me<br/>(Cookie: access_token=<jwt>)

    GW->>GW: Verify JWT
    GW->>Redis: Check denylist
    GW->>AS: GET /auth/me<br/>(X-User-ID: <uuid>, X-Role: user)

    AS->>AS: Auth middleware extracts context
    AS->>AS: Parse user ID from auth context

    AS->>PG: SELECT * FROM users WHERE id = <uuid>
    PG-->>AS: User {id, email, full_name, phone, country, image_url}

    AS-->>GW: 200 {user: {id, email, fullName, phone, country, image, role}}
    GW-->>Client: 200 {user}`,
    },
    {
      heading: 'Failed Login (Wrong Password)',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway :8080
    participant AS as auth-service :8086
    participant PG as PostgreSQL

    Client->>GW: POST /auth/login<br/>{"email": "user@example.com", "password": "wrongpass"}

    GW->>AS: POST /auth/login

    AS->>PG: SELECT * FROM users WHERE email = ?
    PG-->>AS: User found

    AS->>AS: bcrypt.CompareHashAndPassword(hash, "wrongpass")
    Note over AS: Password does NOT match

    AS-->>GW: 401 {code: "INVALID_CREDENTIALS", message: "Invalid credentials"}
    GW-->>Client: 401`,
    },
    {
      heading: 'Duplicate Signup',
      content: `sequenceDiagram
    participant Client
    participant AS as auth-service :8086
    participant PG as PostgreSQL

    Client->>AS: POST /auth/signup<br/>{"email": "existing@example.com", ...}

    AS->>PG: SELECT * FROM users WHERE email = ?
    PG-->>AS: User found (already exists)

    AS-->>Client: 409 {code: "USER_ALREADY_EXISTS", message: "User already exists"}`,
    },
    {
      heading: 'Guest Session Creation',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway :8080
    participant AS as auth-service :8086
    participant Redis

    Client->>GW: POST /auth/guest

    GW->>GW: CORS check
    GW->>AS: POST /auth/guest<br/>(proxied, no auth required)

    Note over AS: Rate limit: 20 req/min per IP

    AS->>AS: uuid.New() → guest_token

    AS->>Redis: SET guest:{token}:jobs "1" EX 86400
    Redis-->>AS: OK

    AS-->>GW: 200 {guest_token, expires_in: 86400}
    GW-->>Client: 200 {guest_token, expires_in: 86400}

    Note over Client: Store token in localStorage<br/>Send as X-Guest-Token header on API calls

    Client->>GW: POST /api/organize-pdf/merge-pdf<br/>X-Guest-Token: {token}

    GW->>Redis: EXISTS guest:{token}:jobs
    Redis-->>GW: 1 (valid)

    GW->>GW: Set X-User-Role: guest<br/>Forward to job-service`,
    },
  ],
  'svc-job': [
    {
      heading: 'Component Diagram',
      content: `graph TB
    subgraph job-service[" job-service :8081 "]
        direction TB

        subgraph Middleware["Middleware Chain (Gin)"]
            TRACE["OpenTelemetry<br/>GinTraceMiddleware"]
            METRICS["Prometheus<br/>GinMetricsMiddleware"]
            REQID["Request ID"]
            LOGGER["Request Logger"]
            AUTHMW["Auth Middleware<br/>(JWT + Guest)"]
        end

        subgraph Routes["Route Groups"]
            subgraph UploadRoutes["/api/uploads"]
                INIT["POST /init"]
                CHUNK["PUT /:uploadId/chunk"]
                STATUS["GET /:uploadId/status"]
                COMPLETE["POST /:uploadId/complete"]
            end

            subgraph ConvertFromRoutes["/api/convert-from-pdf"]
                CF_LIST["GET /:tool"]
                CF_CREATE["POST /:tool"]
                CF_GET["GET /:tool/:id"]
                CF_DELETE["DELETE /:tool/:id"]
                CF_DOWNLOAD["GET /:tool/:id/download"]
            end

            subgraph ConvertToRoutes["/api/convert-to-pdf"]
                CT_LIST["GET /:tool"]
                CT_CREATE["POST /:tool"]
                CT_GET["GET /:tool/:id"]
                CT_DELETE["DELETE /:tool/:id"]
                CT_DOWNLOAD["GET /:tool/:id/download"]
            end

            HISTORY["GET /api/jobs/history"]
            SSE_ROUTE["GET /api/jobs/:id/events"]
            HEALTHZ["/healthz"]
            METRICSEP["/metrics"]
        end

        subgraph Handlers
            UH["Upload Handlers<br/>(chunked upload)"]
            JH["Job Handlers<br/>(CRUD + dispatch)"]
            SSEH["SSE Handler<br/>(real-time job updates)"]
        end

        subgraph Internal
            ROUTING["routing.ServiceForTool()<br/>Tool-to-service mapping"]
            VERIFIER["Auth Verifier"]
            DENYLIST["Token Denylist"]
            GUESTSTORE["Guest Store"]
        end

        subgraph RateLimiting
            RL_UPLOAD["upload: 30 req/min"]
        end
    end

    Client["api-gateway"] --> TRACE
    TRACE --> METRICS --> REQID --> LOGGER --> AUTHMW

    UploadRoutes --> UH
    ConvertFromRoutes --> JH
    ConvertToRoutes --> JH
    HISTORY --> JH
    SSE_ROUTE --> SSEH

    UH --> Redis[(Redis)]
    UH --> Disk[(File System)]
    JH --> PG[(PostgreSQL)]
    JH --> Redis
    JH --> ROUTING
    ROUTING --> NATS["NATS JetStream<br/>(PublishJobEvent)"]
    SSEH --> NATS
    DENYLIST --> Redis
    GUESTSTORE --> Redis
    RateLimiting --> Redis`,
    },
    {
      heading: 'Job Dispatch Flow',
      content: `flowchart TD
    A["POST /api/convert-from-pdf/pdf-to-word"] --> B["Normalize tool type"]
    B --> C["Validate tool is supported"]
    C --> D["Save uploaded file(s)"]
    D --> E["Create job record in PostgreSQL<br/>(status: queued)"]
    E --> F["routing.ServiceForTool(toolType)"]
    F --> G{"Service name?"}
    G -->|convert-from-pdf| H["Publish to<br/>jobs.dispatch.convert-from-pdf"]
    G -->|convert-to-pdf| I["Publish to<br/>jobs.dispatch.convert-to-pdf"]
    G -->|organize-pdf| J["Publish to<br/>jobs.dispatch.organize-pdf"]
    G -->|optimize-pdf| K["Publish to<br/>jobs.dispatch.optimize-pdf"]
    H --> L["Return 201 {job}"]
    I --> L
    J --> L
    K --> L`,
    },
    {
      heading: 'Tool-to-Service Routing Map',
      content: `graph LR
    subgraph convert-from-pdf
        A1["pdf-to-word"]
        A2["pdf-to-excel"]
        A3["pdf-to-powerpoint"]
        A4["pdf-to-image"]
        A5["ocr"]
    end

    subgraph convert-to-pdf
        B1["word-to-pdf"]
        B2["excel-to-pdf"]
        B3["powerpoint-to-pdf"]
        B4["image-to-pdf"]
        B5["merge-pdf"]
        B6["split-pdf"]
        B7["compress-pdf"]
        B8["protect-pdf / unlock-pdf"]
        B9["watermark-pdf / sign-pdf / edit-pdf"]
    end

    ROUTER["routing.ServiceForTool()"] --> convert-from-pdf
    ROUTER --> convert-to-pdf`,
    },
    {
      heading: 'Dependency Graph',
      content: `graph LR
    JS[job-service] --> |shared/config| Config
    JS --> |shared/logger| Logger
    JS --> |shared/metrics| Metrics
    JS --> |shared/telemetry| Telemetry
    JS --> |shared/redisstore| RedisStore
    JS --> |shared/natsconn| NATSConn
    JS --> |shared/queue| Queue
    JS --> |shared/response| Response

    JS --> |internal/authverify| AuthVerify
    JS --> |internal/models| Models
    JS --> |internal/routing| Routing

    Models --> |gorm| PG[(PostgreSQL)]
    RedisStore --> |go-redis/v9| Redis[(Redis)]
    NATSConn --> NATS["NATS JetStream"]
    Queue --> |PublishJobEvent| NATS
    AuthVerify --> |golang-jwt/jwt/v5| JWT`,
    },
    {
      heading: 'Create Job (JSON body with uploadId)',
      content: `sequenceDiagram
    participant GW as api-gateway
    participant JS as job-service :8081
    participant Redis
    participant PG as PostgreSQL
    participant Disk as File System
    participant NATS as NATS JetStream

    GW->>JS: POST /api/convert-from-pdf/pdf-to-word<br/>X-User-ID: <uuid><br/>{"uploadId": "<uploadId>"}

    JS->>JS: Auth middleware<br/>Extract user from headers or JWT

    JS->>JS: Normalize tool type<br/>Validate against convertFromTools

    JS->>Redis: HGETALL upload:<uploadId>
    Redis-->>JS: {fileName: "doc.pdf", fileSize: 5242880}

    JS->>Disk: Move file from uploads/<uploadId>/doc.pdf<br/>to uploads/<jobId>/doc.pdf
    JS->>Redis: DEL upload:<uploadId>, upload:<uploadId>:chunks
    JS->>Disk: Remove uploads/<uploadId>/ directory

    JS->>PG: BEGIN TRANSACTION
    JS->>PG: INSERT processing_jobs<br/>(id=<jobId>, tool_type=pdf-to-word,<br/>status=queued, user_id=<uuid>)
    JS->>PG: INSERT file_metadata<br/>(job_id=<jobId>, kind=input, path=...)
    JS->>PG: COMMIT

    JS->>JS: routing.ServiceForTool("pdf-to-word")<br/>returns "convert-from-pdf"

    JS->>NATS: Publish to jobs.dispatch.convert-from-pdf<br/>{eventType: "JobCreated", jobId, toolType,<br/>inputPaths, options, correlationId}

    JS-->>GW: 201 Created {job}`,
    },
    {
      heading: 'Create Job (Multipart upload)',
      content: `sequenceDiagram
    participant GW as api-gateway
    participant JS as job-service :8081
    participant PG as PostgreSQL
    participant NATS as NATS JetStream

    GW->>JS: POST /api/convert-to-pdf/word-to-pdf<br/>Content-Type: multipart/form-data<br/>files[]=report.docx

    JS->>JS: Parse multipart form
    JS->>JS: Validate file extension (.docx)
    JS->>JS: Check file size <= 50 MB

    JS->>JS: Save to uploads/<jobId>/report.docx

    JS->>PG: INSERT processing_jobs (status=queued)
    JS->>PG: INSERT file_metadata (kind=input)

    JS->>JS: routing.ServiceForTool("word-to-pdf")<br/>returns "convert-to-pdf"

    JS->>NATS: Publish to jobs.dispatch.convert-to-pdf<br/>{JobCreated event}

    JS-->>GW: 201 Created {job}`,
    },
    {
      heading: 'Get Job Status',
      content: `sequenceDiagram
    participant GW as api-gateway
    participant JS as job-service :8081
    participant PG as PostgreSQL

    GW->>JS: GET /api/convert-from-pdf/pdf-to-word/<jobId><br/>X-User-ID: <uuid>

    JS->>PG: SELECT * FROM processing_jobs<br/>WHERE id = <jobId> AND tool_type = pdf-to-word

    PG-->>JS: {id, status: "processing", progress: 20, ...}

    JS->>JS: authorizeJobAccess()<br/>Check job.user_id matches X-User-ID

    JS-->>GW: 200 {job}`,
    },
    {
      heading: 'Download Completed Job',
      content: `sequenceDiagram
    participant GW as api-gateway
    participant JS as job-service :8081
    participant PG as PostgreSQL
    participant Disk as File System

    GW->>JS: GET /api/convert-from-pdf/pdf-to-word/<jobId>/download<br/>X-User-ID: <uuid>

    JS->>PG: SELECT * FROM processing_jobs<br/>WHERE id = <jobId> AND tool_type = pdf-to-word
    PG-->>JS: {status: "completed"}

    JS->>JS: authorizeJobAccess() -- OK

    alt FileMetadata cache hit
        JS->>JS: Load from outputFileCache
    else FileMetadata cache miss
        JS->>PG: SELECT * FROM file_metadata<br/>WHERE job_id = <jobId> AND kind = output
        PG-->>JS: {path: "outputs/result.docx", size: 2048000}
        JS->>JS: Store in outputFileCache
    end

    JS->>JS: Determine filename: "doc.docx"<br/>Determine Content-Type

    JS->>Disk: Read outputs/result.docx

    JS-->>GW: 200 OK (streamed)
    Note right of JS: Content-Disposition: attachment<br/>Content-Type: wordprocessingml<br/>FlushInterval set to stream all`,
    },
    {
      heading: 'Delete Job',
      content: `sequenceDiagram
    participant GW as api-gateway
    participant JS as job-service :8081
    participant PG as PostgreSQL
    participant Disk as File System
    participant Redis

    GW->>JS: DELETE /api/convert-from-pdf/pdf-to-word/<jobId>

    JS->>PG: SELECT * FROM processing_jobs WHERE id = <jobId>
    JS->>JS: authorizeJobAccess()

    JS->>PG: SELECT * FROM file_metadata WHERE job_id = <jobId>
    PG-->>JS: [input file, output file]

    loop For each file
        JS->>Disk: os.Remove(file.Path)
    end

    JS->>PG: DELETE FROM file_metadata WHERE job_id = <jobId>
    JS->>PG: DELETE FROM processing_jobs WHERE id = <jobId>

    JS->>Redis: SREM guest:<token>:jobs <jobId>

    JS-->>GW: 204 No Content`,
    },
    {
      heading: 'Guest User Job Access',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway
    participant JS as job-service :8081
    participant Redis
    participant PG as PostgreSQL

    Client->>GW: GET /api/convert-from-pdf/pdf-to-word<br/>(Cookie: guest_token=<token>)

    GW->>Redis: Validate guest token
    GW->>JS: GET /api/convert-from-pdf/pdf-to-word<br/>X-Guest-Token: <token>

    JS->>Redis: SMEMBERS guest:<token>:jobs
    Redis-->>JS: ["job-id-1", "job-id-2"]

    JS->>PG: SELECT * FROM processing_jobs<br/>WHERE id IN (<ids>) AND tool_type = pdf-to-word AND user_id IS NULL

    PG-->>JS: [job1, job2]

    JS-->>GW: 200 {jobs: [...], meta: {page, limit}}
    GW-->>Client: 200 {jobs}`,
    },
    {
      heading: 'SSE Job Status Updates',
      content: `sequenceDiagram
    participant Client
    participant GW as api-gateway
    participant JS as job-service :8081
    participant NATS as NATS JetStream
    participant W as Worker Service

    Client->>GW: GET /api/jobs/<jobId>/events<br/>Accept: text/event-stream
    GW->>JS: Proxy request

    JS->>JS: Set SSE headers<br/>(Content-Type: text/event-stream)

    JS->>NATS: Create ephemeral consumer<br/>on JOBS_EVENTS stream<br/>filter: jobs.events.>

    JS-->>Client: event: connected<br/>data: {"jobId": "<jobId>"}

    loop Until job completes/fails or 5min timeout
        W->>NATS: Publish job event<br/>(jobs.events.JobProgress)

        JS->>NATS: Fetch messages (5s wait)
        NATS-->>JS: JobEvent {jobId, eventType, progress}

        alt Event matches requested jobId
            JS-->>Client: event: job-update<br/>data: {"jobId","status","progress","toolType"}
            JS->>NATS: ACK message
        else Event for different job
            JS->>NATS: ACK message (skip)
        end

        Note over JS,Client: Keepalive comment every 15s<br/>": keepalive"
    end

    W->>NATS: Publish JobCompleted/JobFailed
    NATS-->>JS: Terminal event
    JS-->>Client: event: job-update<br/>data: {final status}
    JS-->>Client: event: done<br/>data: {"jobId": "<jobId>"}
    Note over JS,Client: Connection closed`,
    },
    {
      heading: 'Upload Service Component Diagram',
      content: `graph TB
    subgraph upload-service[" upload-service :8081 "]
        direction TB

        subgraph Middleware["Middleware Chain (Gin)"]
            TRACE["OpenTelemetry<br/>GinTraceMiddleware"]
            METRICS["Prometheus<br/>GinMetricsMiddleware"]
            REQID["Request ID<br/>GinRequestID"]
            LOGGER["Request Logger<br/>GinRequestLogger"]
            AUTHMW["Auth Middleware<br/>(JWT + Guest)"]
        end

        subgraph Routes["Route Groups"]
            subgraph UploadRoutes["/api/uploads"]
                INIT["POST /init"]
                CHUNK["PUT /:uploadId/chunk"]
                STATUS["GET /:uploadId/status"]
                COMPLETE["POST /:uploadId/complete"]
            end

            subgraph JobRoutes["/api/convert-from-pdf & /api/convert-to-pdf"]
                LIST["GET /:tool"]
                CREATE["POST /:tool"]
                GET["GET /:tool/:id"]
                DELETE["DELETE /:tool/:id"]
                DOWNLOAD["GET /:tool/:id/download"]
            end

            subgraph AuthRoutes["/auth"]
                SIGNUP["POST /signup"]
                LOGIN["POST /login"]
                REFRESH["POST /refresh"]
                ME["GET /me"]
                PROFILE["GET /profile"]
                LOGOUT["POST /logout"]
            end

            HISTORY["GET /api/jobs/history"]
        end

        subgraph Handlers
            UH["Upload Handlers"]
            JH["Job Handlers"]
            AH["Auth Endpoints"]
        end

        subgraph Internal
            ISSUER["Token Issuer<br/>(HS256 JWT)"]
            VERIFIER["Auth Verifier"]
            DENYLIST["Token Denylist"]
            GUESTSTORE["Guest Store"]
        end

        subgraph RateLimiting["Rate Limiting"]
            RL_UPLOAD["upload: 30 req/min"]
            RL_LOGIN["login: 5 req/min"]
            RL_SIGNUP["signup: 3 req/min"]
            RL_REFRESH["refresh: 10 req/min"]
        end
    end

    Client["Client"] --> TRACE

    UploadRoutes --> UH
    JobRoutes --> JH
    AuthRoutes --> AH

    UH --> Redis[(Redis)]
    UH --> Disk[(File System)]
    JH --> PG[(PostgreSQL)]
    JH --> Redis
    JH --> Queue["Redis Queue<br/>(job dispatch)"]
    AH --> PG
    AH --> ISSUER
    AH --> DENYLIST
    DENYLIST --> Redis
    GUESTSTORE --> Redis
    RateLimiting --> Redis`,
    },
    {
      heading: 'Upload State Machine',
      content: `stateDiagram-v2
    [*] --> Initialized: POST /init
    Initialized --> Uploading: PUT /chunk (first)
    Uploading --> Uploading: PUT /chunk (subsequent)
    Uploading --> Complete: POST /complete<br/>(all chunks received)
    Uploading --> Expired: TTL exceeded (30m)
    Complete --> Consumed: Job created from uploadId
    Initialized --> Expired: TTL exceeded (2h)
    Expired --> [*]: cleanup-worker removes`,
    },
    {
      heading: 'Upload Service Dependency Graph',
      content: `graph LR
    US[upload-service] --> |shared/config| Config
    US --> |shared/logger| Logger
    US --> |shared/metrics| Metrics
    US --> |shared/telemetry| Telemetry
    US --> |shared/redisstore| RedisStore
    US --> |shared/response| Response
    US --> |shared/queue| Queue

    US --> |internal/authverify| AuthVerify
    US --> |internal/models| Models
    US --> |internal/token| TokenIssuer

    Models --> |gorm| PostgreSQL[(PostgreSQL)]
    RedisStore --> |go-redis/v9| Redis[(Redis)]
    Queue --> |go-redis/v9| Redis
    AuthVerify --> |golang-jwt/jwt/v5| JWT`,
    },
    {
      heading: 'Chunked File Upload Flow',
      content: `sequenceDiagram
    participant Client
    participant US as upload-service :8081
    participant Redis
    participant Disk as File System

    Client->>US: POST /api/uploads/init<br/>{"fileName": "doc.pdf", "fileSize": 10485760, "totalChunks": 5}

    US->>US: Generate uploadId (UUID)
    US->>Redis: HSET upload:<id> fileName, fileSize, totalChunks, createdAt
    US->>Redis: EXPIRE upload:<id> 2h
    US-->>Client: 201 {uploadId: "<uuid>"}

    loop For each chunk (0..4)
        Client->>US: PUT /api/uploads/<id>/chunk?index=N<br/>(multipart: chunk file)

        US->>Redis: HGETALL upload:<id>
        Redis-->>US: {fileName, fileSize, totalChunks, createdAt}

        US->>Disk: Save chunk to uploads/tmp/<id>/00000N.part
        US->>Redis: SADD upload:<id>:chunks N
        US->>Redis: EXPIRE upload:<id>:chunks 2h
        US-->>Client: 200 {uploadId, receivedChunks: N+1, complete: false}
    end

    Client->>US: POST /api/uploads/<id>/complete

    US->>Redis: HGETALL upload:<id>
    US->>Redis: SCARD upload:<id>:chunks
    Note over US: Verify receivedChunks == totalChunks

    US->>Disk: Assemble chunks into uploads/<id>/doc.pdf
    US->>Disk: Remove uploads/tmp/<id>/
    US->>US: Validate assembled file size <= MAX_UPLOAD_MB

    US-->>Client: 200 {uploadId, storedPath}`,
    },
    {
      heading: 'Job Creation from Upload',
      content: `sequenceDiagram
    participant Client
    participant US as upload-service :8081
    participant Redis
    participant PG as PostgreSQL
    participant Disk as File System

    Client->>US: POST /api/convert-from-pdf/pdf-to-word<br/>{"uploadId": "<uuid>"}

    US->>US: Normalize tool type
    US->>US: Validate tool is supported

    US->>Redis: HGETALL upload:<uploadId>
    Redis-->>US: {fileName, fileSize}

    US->>Disk: Move file from uploads/<uploadId>/ to uploads/<jobId>/
    US->>Redis: DEL upload:<uploadId>, upload:<uploadId>:chunks

    US->>PG: BEGIN TRANSACTION
    US->>PG: INSERT processing_jobs (id, tool_type, status=queued, ...)
    US->>PG: INSERT file_metadata (job_id, kind=input, path, ...)
    US->>PG: COMMIT

    US->>US: Determine queue: toolQueueMap[pdf-to-word] = convert-from-pdf
    US->>Redis: RPUSH queue:convert-from-pdf {jobId, toolType, inputPaths, ...}

    US-->>Client: 201 Created {job}`,
    },
    {
      heading: 'Multipart Direct Upload with Job Creation',
      content: `sequenceDiagram
    participant Client
    participant US as upload-service :8081
    participant PG as PostgreSQL
    participant Redis

    Client->>US: POST /api/convert-to-pdf/word-to-pdf<br/>(multipart: files[]=report.docx, options={})

    US->>US: Normalize & validate tool type
    US->>US: Validate file extension (.docx for word-to-pdf)
    US->>US: Check file size <= MAX_UPLOAD_MB (50 MB)

    US->>US: Save file to uploads/<jobId>/report.docx

    US->>PG: BEGIN TRANSACTION
    US->>PG: INSERT processing_jobs (status=queued)
    US->>PG: INSERT file_metadata (kind=input)
    US->>PG: COMMIT

    US->>Redis: RPUSH queue:convert-to-pdf {jobPayload}

    Note over US: If guest user, assign guest token cookie

    US-->>Client: 201 Created {job}`,
    },
    {
      heading: 'Upload Service User Signup',
      content: `sequenceDiagram
    participant Client
    participant US as upload-service :8081
    participant Redis
    participant PG as PostgreSQL

    Client->>US: POST /auth/signup<br/>{"email", "password", "fullName", "country"}

    Note over US: Rate limit: 3 req/min per IP

    US->>US: Validate inputs (email, password 8-128 chars, fullName, country)
    US->>PG: SELECT * FROM users WHERE email = ?
    PG-->>US: Not found (ErrRecordNotFound)

    US->>US: bcrypt.GenerateFromPassword(password)
    US->>PG: INSERT INTO users (email, full_name, password_hash, ...)

    US->>US: Issuer.IssueAccessToken(userId, "user")
    US->>US: Set access_token cookie (HttpOnly, Secure, SameSite)

    US-->>Client: 200 {user: {id, email, fullName, role}}`,
    },
  ],
  'svc-convert-to-pdf': [
    {
      heading: 'Component Diagram',
      content: `graph TB
    subgraph convert-to-pdf[" convert-to-pdf :8083 "]
        direction TB

        subgraph HTTP["HTTP Server (Gin)"]
            TRACE["OpenTelemetry Middleware"]
            METRICS["Metrics Middleware"]
            REQID["Request ID Middleware"]
            LOGGER["Request Logger"]
            RECOVERY["Recovery Middleware"]
            HEALTHZ["/healthz"]
            METRICSEP["/metrics"]
        end

        subgraph Worker["NATS Worker (goroutine)"]
            CONSUMER["JetStream Pull Consumer<br/>Durable: convert-to-pdf<br/>Filter: jobs.dispatch.convert-to-pdf"]
            MSGLOOP["Message Loop<br/>(Fetch 1 at a time, 30s wait)"]
            DISPATCH["Tool Dispatcher"]
        end

        subgraph Processing["processing package"]
            PROC["ProcessFile()"]
            WORD["word-to-pdf"]
            PPT["ppt-to-pdf"]
            EXCEL["excel-to-pdf"]
            HTML["html-to-pdf"]
            IMG["image-to-pdf / img-to-pdf"]
            COMPRESS["compress-pdf"]
            MERGE["merge-pdf"]
            SPLIT["split-pdf"]
            PROTECT["protect-pdf"]
            UNLOCK["unlock-pdf"]
            WATERMARK["watermark-pdf"]
            EDIT["edit-pdf"]
            SIGN["sign-pdf"]
            ODT_PDF["odt-to-pdf"]
            ODS_PDF["ods-to-pdf"]
            ODP_PDF["odp-to-pdf"]
            WORD_ODT["word-to-odt"]
            EXCEL_ODS["excel-to-ods"]
            PPT_ODP["powerpoint-to-odp"]
        end

        subgraph Models["internal/models"]
            DB_CONN["Database Connection<br/>(GORM + PostgreSQL)"]
            JOB_MODEL["ProcessingJob"]
            FILE_MODEL["FileMetadata"]
        end
    end

    NATS["NATS JetStream<br/>JOBS_DISPATCH stream"] -->|jobs.dispatch.convert-to-pdf| CONSUMER
    CONSUMER --> MSGLOOP --> DISPATCH

    DISPATCH --> PROC
    PROC --> WORD
    PROC --> PPT
    PROC --> EXCEL
    PROC --> HTML
    PROC --> IMG
    PROC --> COMPRESS
    PROC --> MERGE
    PROC --> SPLIT
    PROC --> PROTECT
    PROC --> UNLOCK
    PROC --> WATERMARK
    PROC --> EDIT
    PROC --> SIGN
    PROC --> ODT_PDF
    PROC --> ODS_PDF
    PROC --> ODP_PDF
    PROC --> WORD_ODT
    PROC --> EXCEL_ODS
    PROC --> PPT_ODP

    DISPATCH -->|Update status| DB_CONN
    DB_CONN --> PG[(PostgreSQL)]
    HEALTHZ -->|Ping| Redis[(Redis)]
    HEALTHZ -->|Check connected| NATS
    PROC --> Disk[(File System<br/>outputs/)]`,
    },
    {
      heading: 'Allowed Tool Types',
      content: `graph LR
    subgraph ConversionTools["Document-to-PDF Conversions"]
        A["word-to-pdf"]
        B["ppt-to-pdf"]
        C["excel-to-pdf"]
        D["html-to-pdf"]
        E["image-to-pdf<br/>(img-to-pdf)"]
        AA["odt-to-pdf"]
        BB["ods-to-pdf"]
        CC["odp-to-pdf"]
    end

    subgraph OdfTools["Office-to-LibreOffice Conversions"]
        DD["word-to-odt"]
        EE["excel-to-ods"]
        FF["powerpoint-to-odp"]
    end

    subgraph PDFTools["PDF Manipulation Tools"]
        F["compress-pdf"]
        G["merge-pdf"]
        H["split-pdf"]
        I["protect-pdf"]
        J["unlock-pdf"]
        K["watermark-pdf"]
        L["edit-pdf"]
        M["sign-pdf"]
    end`,
    },
    {
      heading: 'Dependency Graph',
      content: `graph LR
    CTP[convert-to-pdf] --> |shared/config| Config
    CTP --> |shared/logger| Logger
    CTP --> |shared/metrics| Metrics
    CTP --> |shared/telemetry| Telemetry
    CTP --> |shared/natsconn| NATSConn
    CTP --> |shared/redisstore| RedisStore
    CTP --> |internal/models| Models
    CTP --> |internal/worker| Worker
    CTP --> |processing| Processing

    NATSConn --> NATS["NATS JetStream"]
    Models --> PG[(PostgreSQL)]
    RedisStore --> Redis[(Redis)]
    Worker --> |google/uuid| UUID
    Worker --> |nats-io/nats.go/jetstream| JetStream`,
    },
    {
      heading: 'Job Processing (Happy Path)',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as convert-to-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message from<br/>jobs.dispatch.convert-to-pdf

    Worker->>Worker: Unmarshal JobPayload<br/>{jobId, toolType: "word-to-pdf", inputPaths, options}

    Worker->>Worker: Validate toolType in AllowedTools

    Worker->>PG: UPDATE processing_jobs<br/>SET status=processing, progress=20

    Worker->>Processing: ProcessFile(ctx, jobId, "word-to-pdf", inputPaths, options, outputDir)

    Processing->>Disk: Read input Word document
    Processing->>Processing: Convert Word to PDF
    Processing->>Disk: Write output PDF to outputs/

    Processing-->>Worker: {OutputPath: "outputs/<jobId>.pdf", Metadata: {...}}

    Worker->>PG: INSERT file_metadata (kind=output, path, size)
    Worker->>PG: Merge metadata into job record
    Worker->>PG: UPDATE status=completed, progress=100

    Worker->>NATS: ACK message`,
    },
    {
      heading: 'Merge PDF Processing',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as convert-to-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message<br/>{toolType: "merge-pdf", inputPaths: [file1.pdf, file2.pdf, file3.pdf]}

    Worker->>PG: SET status=processing

    Worker->>Processing: ProcessFile(ctx, jobId, "merge-pdf", [3 paths], {}, outputDir)

    Processing->>Disk: Read file1.pdf
    Processing->>Disk: Read file2.pdf
    Processing->>Disk: Read file3.pdf
    Processing->>Processing: Merge PDFs in order
    Processing->>Disk: Write merged.pdf

    Processing-->>Worker: {OutputPath: "outputs/merged.pdf"}

    Worker->>PG: Record output file metadata
    Worker->>PG: SET status=completed, progress=100

    Worker->>NATS: ACK`,
    },
    {
      heading: 'Image-to-PDF Conversion',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as convert-to-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message<br/>{toolType: "image-to-pdf", inputPaths: ["photo.jpg"]}

    Worker->>PG: SET status=processing

    Worker->>Processing: ProcessFile(ctx, jobId, "image-to-pdf", ["photo.jpg"], options, outputDir)

    Processing->>Disk: Read image file
    Processing->>Processing: Create PDF with embedded image
    Processing->>Disk: Write output.pdf

    Processing-->>Worker: {OutputPath, Metadata}

    Worker->>PG: Record output, SET status=completed
    Worker->>NATS: ACK`,
    },
    {
      heading: 'Worker Lifecycle',
      content: `sequenceDiagram
    participant Main as main()
    participant NATS as NATS JetStream
    participant Worker as worker.Run()
    participant Consumer as Pull Consumer

    Main->>NATS: Connect + EnsureStreams
    Main->>Worker: go worker.Run(ctx, config)

    Worker->>NATS: CreateOrUpdateConsumer<br/>(durable: convert-to-pdf,<br/>filter: jobs.dispatch.convert-to-pdf,<br/>maxDeliver: 4, ackWait: 30m)
    Worker->>Worker: Init semaphore (WORKER_CONCURRENCY=2)

    NATS-->>Worker: Consumer ready

    loop Until context cancelled
        Worker->>Consumer: Fetch(maxConcurrency, maxWait=30s)

        alt Messages available
            Consumer-->>Worker: 1..N Messages
            loop For each message
                Worker->>Worker: Acquire semaphore slot
                Worker->>Worker: go processMessage(msg)
                Note over Worker: Release slot on completion
            end
        else No messages (timeout)
            Consumer-->>Worker: ErrNoMessages
            Note over Worker: Continue loop
        end
    end

    Note over Worker: Context cancelled
    Worker->>Worker: wg.Wait() (drain in-flight jobs)
    Worker-->>Main: Return`,
    },
  ],
  'svc-convert-from-pdf': [
    {
      heading: 'Component Diagram',
      content: `graph TB
    subgraph convert-from-pdf[" convert-from-pdf :8082 "]
        direction TB

        subgraph HTTP["HTTP Server (Gin)"]
            TRACE["OpenTelemetry Middleware"]
            METRICS["Metrics Middleware"]
            REQID["Request ID Middleware"]
            LOGGER["Request Logger"]
            RECOVERY["Recovery Middleware"]
            HEALTHZ["/healthz"]
            METRICSEP["/metrics"]
        end

        subgraph Worker["NATS Worker (goroutine)"]
            CONSUMER["JetStream Pull Consumer<br/>Durable: convert-from-pdf<br/>Filter: jobs.dispatch.convert-from-pdf"]
            MSGLOOP["Message Loop<br/>(Fetch 1 at a time, 30s wait)"]
            DISPATCH["Tool Dispatcher"]
        end

        subgraph Processing["processing package"]
            PROC["ProcessFile()"]
            PDF_IMG["pdf-to-image"]
            PDF_WORD["pdf-to-word / pdf-to-docx"]
            PDF_EXCEL["pdf-to-excel / pdf-to-xlsx"]
            PDF_PPT["pdf-to-ppt / pdf-to-pptx"]
            PDF_HTML["pdf-to-html"]
            PDF_TEXT["pdf-to-text / pdf-to-txt"]
            PDF_PDFA["pdf-to-pdfa"]
            PDF_ODT["pdf-to-odt"]
            PDF_ODS["pdf-to-ods"]
            PDF_ODP["pdf-to-odp"]
        end

        subgraph Models["internal/models"]
            DB_CONN["Database Connection<br/>(GORM + PostgreSQL)"]
            JOB_MODEL["ProcessingJob model"]
            FILE_MODEL["FileMetadata model"]
        end
    end

    NATS["NATS JetStream<br/>JOBS_DISPATCH stream"] -->|jobs.dispatch.convert-from-pdf| CONSUMER
    CONSUMER --> MSGLOOP --> DISPATCH

    DISPATCH --> PROC
    PROC --> PDF_IMG
    PROC --> PDF_WORD
    PROC --> PDF_EXCEL
    PROC --> PDF_PPT
    PROC --> PDF_HTML
    PROC --> PDF_TEXT
    PROC --> PDF_PDFA
    PROC --> PDF_ODT
    PROC --> PDF_ODS
    PROC --> PDF_ODP

    DISPATCH -->|Update status| DB_CONN
    DISPATCH -->|Record output| DB_CONN

    DB_CONN --> PG[(PostgreSQL)]
    HEALTHZ -->|Ping| Redis[(Redis)]
    HEALTHZ -->|Check connected| NATS

    PROC --> Disk[(File System<br/>outputs/)]`,
    },
    {
      heading: 'Allowed Tool Types',
      content: `graph LR
    subgraph AllowedTools["Allowed Tool Types"]
        A["pdf-to-image<br/>(pdf-to-img)"]
        B["pdf-to-pdfa"]
        C["pdf-to-word<br/>(pdf-to-docx)"]
        D["pdf-to-excel<br/>(pdf-to-xlsx)"]
        E["pdf-to-ppt<br/>(pdf-to-powerpoint, pdf-to-pptx)"]
        F["pdf-to-html"]
        G["pdf-to-text<br/>(pdf-to-txt)"]
        H["pdf-to-odt"]
        I["pdf-to-ods"]
        J["pdf-to-odp"]
    end`,
    },
    {
      heading: 'Worker Retry Strategy',
      content: `stateDiagram-v2
    [*] --> Delivered: NATS delivers message
    Delivered --> Processing: Parse payload, validate tool
    Processing --> Completed: Process succeeds
    Processing --> RetryDecision: Process fails

    RetryDecision --> NAK_10s: Delivery 1, recoverable
    RetryDecision --> NAK_30s: Delivery 2, recoverable
    RetryDecision --> NAK_2m: Delivery 3, recoverable
    RetryDecision --> Failed: Delivery 4 OR non-recoverable

    NAK_10s --> Delivered: Redeliver after 10s
    NAK_30s --> Delivered: Redeliver after 30s
    NAK_2m --> Delivered: Redeliver after 2m

    Completed --> [*]: ACK message
    Failed --> [*]: ACK message (stop redelivery)`,
    },
    {
      heading: 'Job Processing (Happy Path)',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as convert-from-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message from<br/>jobs.dispatch.convert-from-pdf

    Worker->>Worker: Unmarshal JobPayload<br/>{jobId, toolType, inputPaths, options}

    Worker->>Worker: Validate toolType in AllowedTools

    Worker->>PG: UPDATE processing_jobs<br/>SET status=processing, progress=20<br/>WHERE id=<jobId>

    Worker->>Worker: Parse options JSON

    Worker->>Processing: ProcessFile(ctx, jobId, toolType, inputPaths, options, outputDir)

    Processing->>Disk: Read input file(s)
    Processing->>Processing: Execute conversion<br/>(e.g., pdf-to-word)
    Processing->>Disk: Write output file to outputs/

    Processing-->>Worker: {OutputPath, Metadata}

    Worker->>PG: DELETE file_metadata WHERE job_id=<id> AND kind=output
    Worker->>Disk: Stat output file (get size)
    Worker->>PG: INSERT file_metadata<br/>(job_id, kind=output, path, size)

    Worker->>PG: Merge metadata into job.metadata JSON
    Worker->>PG: UPDATE processing_jobs<br/>SET status=completed, progress=100, completed_at=now()
    Worker->>PG: UPDATE processing_jobs<br/>SET failure_reason=NULL

    Worker->>NATS: ACK message

    Note over Worker: Log: "job completed"`,
    },
    {
      heading: 'Job Processing (Failure with Retry)',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as convert-from-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL

    NATS->>Worker: Deliver message (attempt 1)

    Worker->>PG: SET status=processing, progress=20

    Worker->>Processing: ProcessFile(...)
    Processing-->>Worker: Error (recoverable, e.g., timeout)

    Worker->>Worker: Check: deliveryCount=1 < maxDeliver=4<br/>AND error is recoverable

    Worker->>PG: UPDATE status=queued, progress=0<br/>failure_reason="retrying: timeout"

    Worker->>NATS: NAK with delay=10s

    Note over NATS: Wait 10 seconds

    NATS->>Worker: Redeliver message (attempt 2)

    Worker->>PG: SET status=processing, progress=20

    Worker->>Processing: ProcessFile(...)
    Processing-->>Worker: {OutputPath, Metadata}

    Worker->>PG: Record output, SET status=completed
    Worker->>NATS: ACK`,
    },
    {
      heading: 'Job Processing (Permanent Failure)',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as convert-from-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL

    NATS->>Worker: Deliver message (attempt 4, final)

    Worker->>PG: SET status=processing

    Worker->>Processing: ProcessFile(...)
    Processing-->>Worker: Error (recoverable but retries exhausted)

    Worker->>Worker: Check: deliveryCount=4 >= maxDeliver=4<br/>Retries exhausted

    Worker->>PG: UPDATE status=failed, progress=0<br/>failure_reason="<error message>"

    Worker->>NATS: ACK (stop redelivery)

    Note over Worker: Log: "job failed"`,
    },
    {
      heading: 'Service Startup',
      content: `sequenceDiagram
    participant Main as main()
    participant Config as shared/config
    participant DB as PostgreSQL
    participant Redis
    participant NATS as NATS JetStream
    participant Worker as worker.Run()
    participant Gin as Gin HTTP Server

    Main->>Config: LoadConfig()
    Main->>Main: logger.Init("convert-from-pdf")
    Main->>Main: telemetry.Init("convert-from-pdf")
    Main->>DB: models.Connect() + Migrate()
    Main->>Redis: redisstore.Connect()
    Main->>NATS: natsconn.Connect()
    Main->>NATS: EnsureStreams(JOBS_DISPATCH, JOBS_EVENTS)

    Main->>Worker: go worker.Run(ctx, config)<br/>(background goroutine)

    Note over Worker: Creates durable consumer<br/>FilterSubject: jobs.dispatch.convert-from-pdf<br/>MaxDeliver: 4, AckWait: 30m

    Main->>Gin: Setup /healthz, /metrics
    Main->>Gin: ListenAndServe(:8082)

    Note over Main: Block on SIGINT/SIGTERM
    Main->>Worker: Cancel context
    Main->>Gin: Graceful shutdown (10s)`,
    },
  ],
  'svc-organize-pdf': [
    {
      heading: 'Component Diagram',
      content: `graph TB
    subgraph organize-pdf[" organize-pdf :8084 "]
        direction TB

        subgraph HTTP["HTTP Server (Gin)"]
            TRACE["OpenTelemetry Middleware"]
            METRICS["Metrics Middleware"]
            REQID["Request ID Middleware"]
            LOGGER["Request Logger"]
            RECOVERY["Recovery Middleware"]
            HEALTHZ["/healthz"]
            METRICSEP["/metrics"]
        end

        subgraph Worker["NATS Worker (goroutine)"]
            CONSUMER["JetStream Pull Consumer<br/>Durable: organize-pdf<br/>Filter: jobs.dispatch.organize-pdf"]
            MSGLOOP["Message Loop"]
            DISPATCH["Tool Dispatcher"]
        end

        subgraph Processing["processing package"]
            PROC["ProcessFile()"]
            MERGE["merge-pdf"]
            SPLIT["split-pdf"]
            REMOVE["remove-pages"]
            EXTRACT["extract-pages"]
            ORGANIZE["organize-pdf"]
            SCAN["scan-to-pdf"]
        end

        subgraph Models["internal/models"]
            DB_CONN["Database Connection<br/>(GORM)"]
            JOB_MODEL["ProcessingJob"]
            FILE_MODEL["FileMetadata"]
        end
    end

    NATS["NATS JetStream<br/>JOBS_DISPATCH"] -->|jobs.dispatch.organize-pdf| CONSUMER
    CONSUMER --> MSGLOOP --> DISPATCH

    DISPATCH --> PROC
    PROC --> MERGE
    PROC --> SPLIT
    PROC --> REMOVE
    PROC --> EXTRACT
    PROC --> ORGANIZE
    PROC --> SCAN

    DISPATCH -->|Update status| DB_CONN
    DB_CONN --> PG[(PostgreSQL)]
    HEALTHZ -->|Ping| Redis[(Redis)]
    HEALTHZ -->|Check connected| NATS
    PROC --> Disk[(File System<br/>outputs/)]`,
    },
    {
      heading: 'Allowed Tool Types',
      content: `graph LR
    subgraph Tools["organize-pdf Tool Types"]
        A["merge-pdf<br/>Combine multiple PDFs"]
        B["split-pdf<br/>Split into pages/ranges"]
        C["remove-pages<br/>Remove specific pages"]
        D["extract-pages<br/>Extract page subset"]
        E["organize-pdf<br/>Reorder pages"]
        F["scan-to-pdf<br/>Scan images to PDF"]
    end`,
    },
    {
      heading: 'Worker Configuration',
      content: `graph TD
    subgraph ConsumerConfig["NATS Consumer Configuration"]
        A["Durable: organize-pdf"]
        B["FilterSubject: jobs.dispatch.organize-pdf"]
        C["AckPolicy: Explicit"]
        D["MaxDeliver: 4"]
        E["AckWait: 30 minutes"]
        F["BackOff: 10s, 30s, 2m"]
    end

    subgraph Dependencies
        PG[(PostgreSQL)]
        Redis[(Redis)]
        NATS["NATS JetStream"]
        Disk[(File System)]
    end

    ConsumerConfig --> NATS`,
    },
    {
      heading: 'Split PDF Processing',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as organize-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message from<br/>jobs.dispatch.organize-pdf

    Worker->>Worker: Unmarshal JobPayload<br/>{jobId, toolType: "split-pdf", inputPaths: ["doc.pdf"], options: {pages: "1-3,5"}}

    Worker->>Worker: Validate toolType in AllowedTools

    Worker->>PG: UPDATE processing_jobs<br/>SET status=processing, progress=20

    Worker->>Processing: ProcessFile(ctx, jobId, "split-pdf", ["doc.pdf"], {pages: "1-3,5"}, outputDir)

    Processing->>Disk: Read input PDF
    Processing->>Processing: Split by page ranges
    Processing->>Disk: Write individual page PDFs
    Processing->>Disk: Package into ZIP archive

    Processing-->>Worker: {OutputPath: "outputs/<jobId>.zip", Metadata: {pages: 4}}

    Worker->>PG: INSERT file_metadata (kind=output)
    Worker->>PG: Merge metadata into job
    Worker->>PG: UPDATE status=completed, progress=100

    Worker->>NATS: ACK message`,
    },
    {
      heading: 'Rotate PDF Processing',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as organize-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message from<br/>jobs.dispatch.organize-pdf

    Worker->>Worker: Unmarshal JobPayload<br/>{toolType: "rotate-pdf", options: {rotation: 90, applyToPages: "all"}}

    Worker->>PG: UPDATE processing_jobs SET status=processing, progress=20

    Worker->>Processing: ProcessFile(ctx, jobId, "rotate-pdf", ["doc.pdf"], {rotation: 90, applyToPages: "all"}, outputDir)

    Processing->>Processing: Parse rotation=90, applyToPages="all"
    Processing->>Processing: Build pdfcpu page selection (nil = all pages)
    Processing->>Processing: api.RotateFile(inputPath, outputPath, 90, nil, nil)
    Processing->>Disk: Write rotated PDF

    Processing-->>Worker: {OutputPath: "outputs/<jobId>.pdf"}

    Worker->>PG: INSERT file_metadata (kind=output)
    Worker->>PG: UPDATE status=completed, progress=100
    Worker->>NATS: ACK message`,
    },
    {
      heading: 'Merge PDF Processing',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as organize-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message<br/>{toolType: "merge-pdf", inputPaths: ["a.pdf", "b.pdf", "c.pdf"]}

    Worker->>PG: SET status=processing, progress=20

    Worker->>Processing: ProcessFile(ctx, jobId, "merge-pdf", [3 paths], {}, outputDir)

    Processing->>Disk: Read a.pdf
    Processing->>Disk: Read b.pdf
    Processing->>Disk: Read c.pdf
    Processing->>Processing: Merge in order
    Processing->>Disk: Write merged output

    Processing-->>Worker: {OutputPath, Metadata}

    Worker->>PG: Record output, SET status=completed
    Worker->>NATS: ACK`,
    },
    {
      heading: 'Extract Pages Processing',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as organize-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message<br/>{toolType: "extract-pages", inputPaths: ["report.pdf"], options: {pages: "2,4,6-10"}}

    Worker->>PG: SET status=processing

    Worker->>Processing: ProcessFile(ctx, jobId, "extract-pages", ["report.pdf"], {pages: "2,4,6-10"}, outputDir)

    Processing->>Disk: Read report.pdf
    Processing->>Processing: Extract specified pages
    Processing->>Disk: Write extracted pages PDF

    Processing-->>Worker: {OutputPath, Metadata}

    Worker->>PG: Record output, SET status=completed
    Worker->>NATS: ACK`,
    },
    {
      heading: 'Service Startup',
      content: `sequenceDiagram
    participant Main as main()
    participant Config as shared/config
    participant DB as PostgreSQL
    participant Redis
    participant NATS as NATS JetStream
    participant Worker as worker.Run()
    participant Gin as Gin HTTP :8084

    Main->>Config: LoadConfig()
    Main->>Main: logger.Init("organize-pdf")
    Main->>Main: telemetry.Init("organize-pdf")
    Main->>DB: models.Connect() + Migrate()
    Main->>Redis: redisstore.Connect()
    Main->>NATS: natsconn.Connect()
    Main->>NATS: EnsureStreams()

    Main->>Worker: go worker.Run(ctx, WorkerConfig{<br/>  ServiceName: "organize-pdf",<br/>  AllowedTools: [merge, split, remove, extract, organize, scan]<br/>})

    Main->>Gin: Setup /healthz, /metrics
    Main->>Gin: ListenAndServe(:8084)

    Note over Main: Block until SIGINT/SIGTERM
    Main->>Worker: Cancel context
    Main->>Gin: Graceful shutdown`,
    },
  ],
  'svc-optimize-pdf': [
    {
      heading: 'Component Diagram',
      content: `graph TB
    subgraph optimize-pdf[" optimize-pdf :8085 "]
        direction TB

        subgraph HTTP["HTTP Server (Gin)"]
            TRACE["OpenTelemetry Middleware"]
            METRICS["Metrics Middleware"]
            REQID["Request ID Middleware"]
            LOGGER["Request Logger"]
            RECOVERY["Recovery Middleware"]
            HEALTHZ["/healthz"]
            METRICSEP["/metrics"]
        end

        subgraph Worker["NATS Worker (goroutine)"]
            CONSUMER["JetStream Pull Consumer<br/>Durable: optimize-pdf<br/>Filter: jobs.dispatch.optimize-pdf"]
            MSGLOOP["Message Loop<br/>(Fetch 1, 30s wait)"]
            DISPATCH["Tool Dispatcher"]
        end

        subgraph Processing["processing package"]
            PROC["ProcessFile()"]
            COMPRESS["compress-pdf<br/>Reduce file size"]
            REPAIR["repair-pdf<br/>Fix corrupted PDFs"]
            OCR["ocr-pdf<br/>Add text layer via OCR"]
        end

        subgraph Models["internal/models"]
            DB_CONN["Database Connection<br/>(GORM)"]
            JOB_MODEL["ProcessingJob"]
            FILE_MODEL["FileMetadata"]
        end
    end

    NATS["NATS JetStream<br/>JOBS_DISPATCH"] -->|jobs.dispatch.optimize-pdf| CONSUMER
    CONSUMER --> MSGLOOP --> DISPATCH

    DISPATCH --> PROC
    PROC --> COMPRESS
    PROC --> REPAIR
    PROC --> OCR

    DISPATCH -->|Update status| DB_CONN
    DB_CONN --> PG[(PostgreSQL)]
    HEALTHZ -->|Ping| Redis[(Redis)]
    HEALTHZ -->|Check connected| NATS
    PROC --> Disk[(File System<br/>outputs/)]`,
    },
    {
      heading: 'Allowed Tool Types',
      content: `graph LR
    subgraph Tools["optimize-pdf Tool Types"]
        A["compress-pdf<br/>Reduce PDF file size<br/>with quality options"]
        B["repair-pdf<br/>Fix corrupted or<br/>malformed PDF files"]
        C["ocr-pdf<br/>Add searchable text layer<br/>to scanned PDFs"]
    end`,
    },
    {
      heading: 'Service Architecture Pattern',
      content: `graph TD
    subgraph Pattern["Worker Service Pattern (all worker services follow this)"]
        direction TB
        MAIN["main()"] -->|1| CONFIG["Load config + init logging"]
        CONFIG -->|2| INFRA["Connect DB, Redis, NATS"]
        INFRA -->|3| STREAMS["Ensure NATS JetStream streams"]
        STREAMS -->|4| WORKER["Launch worker goroutine"]
        STREAMS -->|5| HTTP["Start HTTP server<br/>(health + metrics only)"]
        HTTP -->|6| SIGNAL["Wait for shutdown signal"]
        SIGNAL -->|7| CLEANUP["Cancel ctx, drain NATS, shutdown HTTP"]
    end`,
    },
    {
      heading: 'Compress PDF Processing',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as optimize-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message from<br/>jobs.dispatch.optimize-pdf

    Worker->>Worker: Unmarshal JobPayload<br/>{jobId, toolType: "compress-pdf",<br/>inputPaths: ["large.pdf"],<br/>options: {quality: "medium"}}

    Worker->>Worker: Validate toolType in AllowedTools

    Worker->>PG: UPDATE processing_jobs<br/>SET status=processing, progress=20

    Worker->>Processing: ProcessFile(ctx, jobId, "compress-pdf",<br/>["large.pdf"], {quality: "medium"}, outputDir)

    Processing->>Disk: Read large.pdf (e.g., 50 MB)
    Processing->>Processing: Compress with quality settings
    Processing->>Disk: Write compressed output (e.g., 12 MB)

    Processing-->>Worker: {OutputPath: "outputs/compressed.pdf",<br/>Metadata: {originalSize: 50MB, compressedSize: 12MB}}

    Worker->>PG: INSERT file_metadata (kind=output)
    Worker->>PG: Merge compression metadata
    Worker->>PG: UPDATE status=completed, progress=100

    Worker->>NATS: ACK message`,
    },
    {
      heading: 'OCR PDF Processing',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as optimize-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message<br/>{toolType: "ocr-pdf", inputPaths: ["scanned.pdf"], options: {language: "en"}}

    Worker->>PG: SET status=processing, progress=20

    Worker->>Processing: ProcessFile(ctx, jobId, "ocr-pdf",<br/>["scanned.pdf"], {language: "en"}, outputDir)

    Processing->>Disk: Read scanned PDF
    Processing->>Processing: Run OCR engine<br/>(extract text from images)
    Processing->>Processing: Add searchable text layer
    Processing->>Disk: Write OCR-enhanced PDF

    Processing-->>Worker: {OutputPath, Metadata}

    Worker->>PG: Record output, merge metadata
    Worker->>PG: SET status=completed, progress=100
    Worker->>NATS: ACK`,
    },
    {
      heading: 'Repair PDF Processing',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as optimize-pdf worker
    participant Processing as processing.ProcessFile()
    participant PG as PostgreSQL
    participant Disk as File System

    NATS->>Worker: Fetch message<br/>{toolType: "repair-pdf", inputPaths: ["corrupted.pdf"]}

    Worker->>PG: SET status=processing, progress=20

    Worker->>Processing: ProcessFile(ctx, jobId, "repair-pdf",<br/>["corrupted.pdf"], {}, outputDir)

    Processing->>Disk: Read corrupted PDF
    Processing->>Processing: Analyze and repair structure
    Processing->>Disk: Write repaired PDF

    Processing-->>Worker: {OutputPath, Metadata}

    Worker->>PG: Record output, SET status=completed
    Worker->>NATS: ACK`,
    },
    {
      heading: 'Failure and Retry Flow',
      content: `sequenceDiagram
    participant NATS as NATS JetStream
    participant Worker as optimize-pdf worker
    participant PG as PostgreSQL

    Note over NATS,Worker: Attempt 1

    NATS->>Worker: Deliver message (delivery 1)
    Worker->>PG: SET status=processing
    Worker->>Worker: ProcessFile() fails<br/>(timeout - recoverable)
    Worker->>PG: SET status=queued, failure_reason="retrying: timeout"
    Worker->>NATS: NAK with delay=10s

    Note over NATS,Worker: Attempt 2 (after 10s)

    NATS->>Worker: Redeliver (delivery 2)
    Worker->>PG: SET status=processing
    Worker->>Worker: ProcessFile() fails again
    Worker->>PG: SET status=queued, failure_reason="retrying: ..."
    Worker->>NATS: NAK with delay=30s

    Note over NATS,Worker: Attempt 3 (after 30s)

    NATS->>Worker: Redeliver (delivery 3)
    Worker->>PG: SET status=processing
    Worker->>Worker: ProcessFile() fails again
    Worker->>NATS: NAK with delay=2m

    Note over NATS,Worker: Attempt 4 (final, after 2m)

    NATS->>Worker: Redeliver (delivery 4)
    Worker->>PG: SET status=processing
    Worker->>Worker: ProcessFile() fails
    Worker->>Worker: deliveryCount=4 >= maxDeliver=4
    Worker->>PG: SET status=failed, failure_reason="<error>"
    Worker->>NATS: ACK (stop redelivery)`,
    },
  ],
  'svc-analytics': [
    {
      heading: 'Analytics Service Architecture',
      content: `graph TB
    subgraph "Analytics Service"
        MAIN[main.go]
        SUB[subscriber]
        HANDLERS[handlers/metrics.go]
        ROUTES[routes/routes.go]
        MODELS[internal/models]
    end

    subgraph "External Dependencies"
        PG[(PostgreSQL)]
        NATS[NATS JetStream]
        GW[API Gateway]
    end

    subgraph "Event Sources"
        AUTH[auth-service]
        JOB[job-service]
        WORKERS[worker services]
    end

    AUTH -->|analytics.events.user.*| NATS
    JOB -->|analytics.events.job.*| NATS
    JOB -->|analytics.events.plan.*| NATS
    WORKERS -->|jobs.events.*| NATS

    NATS -->|subscribe| SUB
    SUB -->|persist| MODELS
    MODELS -->|GORM| PG

    GW -->|/admin/*| ROUTES
    ROUTES -->|admin auth| HANDLERS
    HANDLERS -->|query| MODELS`,
    },
    {
      heading: 'Data Flow',
      content: `sequenceDiagram
    participant Auth as auth-service
    participant Job as job-service
    participant NATS as NATS JetStream
    participant Analytics as analytics-service
    participant DB as PostgreSQL
    participant Admin as Admin Dashboard

    Auth->>NATS: publish(analytics.events.user.signup)
    Job->>NATS: publish(analytics.events.job.created)
    Job->>NATS: publish(analytics.events.plan.limit_hit)

    NATS->>Analytics: deliver(analytics event)
    Analytics->>DB: INSERT analytics_events

    Admin->>Analytics: GET /admin/metrics/overview
    Analytics->>DB: SELECT aggregations
    Analytics->>Admin: JSON response`,
    },
  ],
  'svc-cleanup': [
    {
      heading: 'Component Diagram',
      content: `graph TB
    subgraph cleanup-worker[" cleanup-worker "]
        direction TB

        subgraph Main["main() Loop"]
            INIT["Initialize<br/>Config, Logger, Telemetry"]
            CONNECT["Connect DB, Redis"]
            TICKER["time.Ticker<br/>(default: 15 min)"]
            LOOP["Infinite Loop<br/>runCleanup() on each tick"]
        end

        subgraph Cleanup["Cleanup Functions"]
            EXPIRED["cleanupExpiredJobs()"]
            UPLOAD["cleanupUploadState()"]
        end

        subgraph ExpiredJobs["cleanupExpiredJobs()"]
            QUERY["Query expired guest jobs<br/>WHERE user_id IS NULL<br/>AND expires_at <= now()"]
            DELETE_FILES["Delete associated files<br/>from disk"]
            DELETE_META["Delete file_metadata records"]
            DELETE_JOB["Delete processing_job records"]
        end

        subgraph UploadState["cleanupUploadState()"]
            SCAN["Redis SCAN upload:*"]
            CHECK_TTL["Check createdAt > UPLOAD_TTL (30m)"]
            DELETE_REDIS["DEL upload:<id>, upload:<id>:chunks"]
            DELETE_DIR["Remove uploads/tmp/<id>/ directory"]
        end

        subgraph Models["internal/models"]
            DB_CONN["Database Connection<br/>(GORM)"]
            JOB_MODEL["ProcessingJob"]
            FILE_MODEL["FileMetadata"]
        end
    end

    INIT --> CONNECT --> TICKER --> LOOP
    LOOP --> EXPIRED
    LOOP --> UPLOAD

    EXPIRED --> QUERY --> DELETE_FILES --> DELETE_META --> DELETE_JOB
    UPLOAD --> SCAN --> CHECK_TTL --> DELETE_REDIS --> DELETE_DIR

    DB_CONN --> PG[(PostgreSQL)]
    SCAN --> Redis[(Redis)]
    DELETE_REDIS --> Redis
    DELETE_FILES --> Disk[(File System)]
    DELETE_DIR --> Disk`,
    },
    {
      heading: 'Cleanup Targets',
      content: `graph LR
    subgraph Targets["What Gets Cleaned Up"]
        A["Expired Guest Jobs<br/>(user_id IS NULL,<br/>expires_at <= now)"]
        B["Stale Upload State<br/>(Redis keys older than<br/>UPLOAD_TTL / 30 minutes)"]
        C["Orphaned Chunk Directories<br/>(uploads/tmp/<id>/)"]
    end

    subgraph NotCleaned["Not Cleaned (Handled Elsewhere)"]
        D["Registered User Jobs<br/>(kept indefinitely)"]
        E["NATS Message Redelivery<br/>(handled by JetStream AckWait)"]
    end`,
    },
    {
      heading: 'Configuration',
      content: `graph TD
    subgraph EnvVars["Environment Variables"]
        A["CLEANUP_INTERVAL<br/>Default: 15m<br/>How often the ticker fires"]
        B["UPLOAD_TTL<br/>Default: 30m<br/>Max age for upload state in Redis"]
        C["UPLOAD_DIR<br/>Default: uploads<br/>Base directory for uploaded files"]
    end`,
    },
    {
      heading: 'Main Loop',
      content: `sequenceDiagram
    participant Main as main()
    participant Config as shared/config
    participant DB as PostgreSQL
    participant Redis
    participant Cleanup as runCleanup()

    Main->>Config: LoadConfig()
    Main->>Main: logger.Init("cleanup-worker")
    Main->>Main: telemetry.Init("cleanup-worker")
    Main->>DB: models.Connect() + Migrate()
    Main->>Redis: redisstore.Connect()

    Main->>Main: Start ticker (15 min interval)

    loop Every 15 minutes (forever)
        Main->>Cleanup: runCleanup(ctx)

        Cleanup->>Cleanup: cleanupExpiredJobs(ctx)
        Cleanup->>Cleanup: cleanupUploadState(ctx)

        Note over Main: Wait for next tick
    end`,
    },
    {
      heading: 'Cleanup Expired Guest Jobs',
      content: `sequenceDiagram
    participant CW as cleanup-worker
    participant PG as PostgreSQL
    participant Disk as File System

    CW->>PG: SELECT * FROM processing_jobs<br/>WHERE user_id IS NULL<br/>AND expires_at IS NOT NULL<br/>AND expires_at <= now()<br/>LIMIT 100

    PG-->>CW: [job1, job2, ..., jobN]

    loop For each expired job
        CW->>PG: SELECT * FROM file_metadata<br/>WHERE job_id = <job.id>
        PG-->>CW: [file1, file2]

        loop For each file
            CW->>Disk: os.Remove(file.Path)
            Note over Disk: Remove input/output files
        end

        CW->>PG: DELETE FROM file_metadata<br/>WHERE job_id = <job.id>

        CW->>PG: DELETE FROM processing_jobs<br/>WHERE id = <job.id>
    end

    alt More than 100 jobs found
        Note over CW: Loop again (paginated cleanup)
        CW->>PG: SELECT next batch...
    else Fewer than 100 jobs
        Note over CW: Done with expired jobs
    end`,
    },
    {
      heading: 'Cleanup Stale Upload State',
      content: `sequenceDiagram
    participant CW as cleanup-worker
    participant Redis
    participant Disk as File System

    CW->>Redis: SCAN 0 MATCH upload:* COUNT 100
    Redis-->>CW: [cursor, keys]

    loop For each key (skip :chunks keys)
        CW->>Redis: HGET upload:<id> createdAt
        Redis-->>CW: "2024-01-15T10:30:00Z"

        CW->>CW: Parse timestamp<br/>Check: time.Since(createdAt) > 2h

        alt Upload is stale (> 2h old)
            CW->>Redis: DEL upload:<id>
            CW->>Redis: DEL upload:<id>:chunks

            CW->>CW: Parse upload ID as UUID

            alt Valid UUID
                CW->>Disk: os.RemoveAll(uploads/tmp/<id>/)
                Note over Disk: Remove orphaned chunk directory
            end
        else Upload is recent
            Note over CW: Skip (still valid)
        end
    end

    Note over CW: Continue SCAN until cursor = 0`,
    },
    {
      heading: 'Cleanup Decision Flow',
      content: `flowchart TD
    A["Cleanup tick fires"] --> B["cleanupExpiredJobs()"]
    B --> C{"Any expired guest jobs?"}
    C -->|Yes| D["Batch delete (100 at a time)"]
    D --> E["Delete files from disk"]
    E --> F["Delete file_metadata records"]
    F --> G["Delete processing_jobs records"]
    G --> C
    C -->|No more| H["cleanupUploadState()"]

    H --> I["SCAN Redis for upload:* keys"]
    I --> J{"Key is :chunks suffix?"}
    J -->|Yes| K["Skip"]
    J -->|No| L{"createdAt > UPLOAD_TTL?"}
    L -->|No| K
    L -->|Yes| M["DEL Redis keys"]
    M --> N["Remove chunk directory from disk"]
    N --> I
    K --> I`,
    },
    {
      heading: 'Timing Diagram',
      content: `gantt
    title Cleanup Worker Execution Timeline
    dateFormat mm:ss
    axisFormat %M:%S

    section Startup
    Load config & connect    :s1, 00:00, 2s
    First cleanup run        :s2, after s1, 5s

    section Periodic (every 15 min)
    Wait for tick            :w1, after s2, 14m
    Expired jobs cleanup     :c1, after w1, 3s
    Upload state cleanup     :c2, after c1, 2s
    Wait for tick            :w2, after c2, 14m
    Expired jobs cleanup     :c3, after w2, 3s
    Upload state cleanup     :c4, after c3, 2s`,
    },
  ],
};
