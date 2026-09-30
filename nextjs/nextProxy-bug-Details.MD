# Next.js Middleware / Proxy Authorization Bypass — Security Deep Dive

> **Purpose:** Understand why relying only on Next.js `middleware.ts` / `proxy.ts` for authentication or authorization is dangerous, what historical vulnerabilities demonstrated this, and what a production-grade security architecture should look like.

---

## 1. Executive Summary

Next.js provides a request interception mechanism historically called:

```text
middleware.ts
```

and, in newer Next.js versions:

```text
proxy.ts
```

It can be used for:

* authentication redirects
* request rewriting
* routing
* locale detection
* feature flags
* lightweight access checks
* request/response manipulation

However:

> **Middleware/Proxy should not be the final security boundary for sensitive authorization.**

There have been multiple real Next.js vulnerabilities where applications that relied on Middleware/Proxy-based authorization could be bypassed through specially crafted requests or alternate request paths.

Examples include:

* **CVE-2024-51479** — authorization bypass involving pathname-based Middleware authorization.
* **CVE-2025-29927** — critical Middleware authorization bypass involving the `x-middleware-subrequest` mechanism.
* **CVE-2026-44575** — App Router Middleware/Proxy bypass through segment-prefetch/RSC route variants.
* **CVE-2026-44574** — Middleware/Proxy bypass through dynamic route parameter injection.
* **CVE-2026-64642** — App Router Middleware/Proxy authentication bypass involving Turbopack and a specific i18n configuration.

These vulnerabilities were fixed in subsequent Next.js releases, but they demonstrate an important architectural principle:

> **A request-level routing mechanism should not be your only authorization enforcement point.**

The secure design is:

```text
                    REQUEST
                       │
                       ▼
                 Proxy / WAF
                       │
                 Lightweight
                 access check
                       │
                       ▼
                    ROUTE
                       │
                       ▼
              Server-side code
                       │
                       ▼
              Authentication
                       │
                       ▼
              Authorization
                       │
                       ▼
              Business Logic
                       │
                       ▼
                   Database
```

The deeper principle is:

> **Security must be enforced as close as possible to the resource or operation being protected.**

---

# 2. What Was the Historical Bypass Class?

The historical issue was not simply:

> "`middleware.ts` is insecure."

The more accurate explanation is:

> **Next.js had vulnerabilities in how certain requests were normalized, routed, matched, or interpreted before/around Middleware execution.**

If an application had:

```text
Middleware
    ↓
"Is this user allowed?"
    ↓
Allow
```

then an attacker might try to construct a request that caused:

```text
Attacker request
       ↓
Next.js routing behavior
       ↓
Middleware does not execute as expected
       ↓
Protected route/resource is still reached
```

That creates an authorization bypass.

---

# 3. Why Is This Dangerous?

Imagine a website:

```text
/admin
```

and the application has:

```ts
export function middleware(request) {
  const session = request.cookies.get("session");

  if (!session) {
    return Response.redirect(
      new URL("/login", request.url)
    );
  }

  return NextResponse.next();
}
```

The developer may believe:

```text
/admin
   ↓
middleware
   ↓
authentication
   ↓
admin page
```

Therefore:

> "Nobody can reach `/admin` without authentication."

But that assumption is only true if **every relevant request that can reach the protected resource is guaranteed to pass through the intended Middleware check**.

Historically, that guarantee has been broken in several ways.

---

# 4. Example: CVE-2025-29927

One of the most important historical examples is:

**CVE-2025-29927 — Next.js Middleware Authorization Bypass**

Affected versions included multiple Next.js 12, 13, 14 and 15 releases, with fixes released in:

```text
12.3.5
13.5.9
14.2.25
15.2.3
```

The vulnerability allowed authorization checks performed in Middleware to be bypassed using a specially crafted:

```text
x-middleware-subrequest
```

header.

The GitHub security advisory rated it **Critical, CVSS 9.1**.

Conceptually:

```text
NORMAL REQUEST

Browser
   │
   ▼
/admin
   │
   ▼
Middleware
   │
   ▼
Authentication
   │
   ▼
/admin
```

The vulnerable behavior allowed an attacker to manipulate the request so that the Middleware authorization check could be skipped.

Conceptually:

```text
ATTACKER

Crafted Request
      │
      ▼
Next.js
      │
      X
      │
      └──── Middleware authorization skipped
                    │
                    ▼
                 /admin
```

The important lesson isn't the exact exploit header.

The important lesson is:

> **If Middleware is the only place where authorization exists, bypassing Middleware can become equivalent to bypassing authorization.**

The official advisory recommended upgrading to a patched version and, where upgrading wasn't immediately possible, preventing external requests containing the problematic header from reaching the application.

---

# 5. Another Example: CVE-2024-51479

Another historical vulnerability was:

**CVE-2024-51479**

This affected Next.js versions up to `14.2.14` and was fixed in:

```text
14.2.15
```

The vulnerability involved applications performing authorization in Middleware based on the request pathname.

Under certain conditions, that authorization could be bypassed.

The official advisory classified this as:

```text
Improper Authorization
```

with a CVSS score of **7.5 (High)**.

Again, the fundamental lesson is:

```text
Pathname-based Middleware check
          ≠
guaranteed authorization boundary
```

---

# 6. 2026: App Router Made the Problem More Interesting

This problem didn't disappear with the App Router.

In fact, there were additional 2026 advisories involving Middleware/Proxy and App Router request variants.

This is important because someone might incorrectly think:

> "Those were old Middleware problems. App Router + Proxy solved them."

That's not correct.

---

# 7. CVE-2026-44575 — RSC / Segment Prefetch Bypass

In May 2026, Next.js disclosed a high-severity issue affecting applications using Middleware/Proxy authorization with the App Router.

The affected versions included:

```text
15.2.0 → <15.5.16
16.0.0 → <16.2.5
```

The issue involved alternate transport/request variants used for App Router segment prefetching.

Specifically, specially crafted:

```text
.rsc
```

and segment-prefetch requests could reach the same protected page without being matched by the intended Middleware rule.

The official advisory describes this as an authorization bypass and recommends enforcing authorization in the underlying route/page logic rather than relying solely on Middleware.

Conceptually:

```text
NORMAL

GET /dashboard
       │
       ▼
    Proxy
       │
       ▼
 Authentication
       │
       ▼
 Dashboard
```

But an alternate request path could conceptually look like:

```text
SPECIAL REQUEST
       │
       ▼
RSC / prefetch route
       │
       ▼
Matcher does not protect it
       │
       ▼
Dashboard content
```

The fix expanded matching so App Router transport variants were consistently covered.

---

# 8. CVE-2026-44574 — Dynamic Route Parameter Injection

Another 2026 issue affected applications relying on Middleware/Proxy to protect dynamic routes.

Affected versions included:

```text
15.4.0 → <15.5.16
16.0.0 → <16.2.5
```

The issue involved specially crafted query parameters altering the dynamic route parameter seen by the page while leaving the visible URL path unchanged.

That could result in:

```text
Middleware sees one thing
       ↓
Page receives another route parameter
       ↓
Protected content rendered
```

The official advisory classified it as a high-severity authentication/authorization bypass and again recommended enforcing authorization in the route/page logic instead of relying solely on Middleware.

---

# 9. CVE-2026-64642 — Even New Proxy Implementations Need Updates

As recently as July 2026, another high-severity issue was disclosed affecting:

```text
Next.js 16.0.0 → <16.2.11
```

under a specific configuration involving:

* App Router
* Turbopack
* a single i18n locale

Crafted requests could bypass Middleware/Proxy-based authentication.

The fix was released in:

```text
16.2.11
```

The advisory again recommends enforcing authorization in the page's server-side data path instead of relying solely on Middleware/Proxy.

This is particularly useful to remember:

> **Proxy is newer, but the architectural security principle hasn't changed.**

---

# 10. Why Can Middleware-Based Authentication Be Bypassed?

There are several different categories.

## Category 1 — Framework vulnerability

Example:

```text
Attacker
   ↓
crafted request
   ↓
Next.js bug
   ↓
Middleware bypass
   ↓
protected resource
```

You cannot completely eliminate this possibility from application code.

Frameworks can have vulnerabilities.

Therefore:

```text
Middleware
   ↓
ONLY authorization
```

is fragile.

---

# 11. Category 2 — Matcher mistakes

This is extremely common.

Suppose you write:

```ts
export const config = {
  matcher: [
    "/dashboard/:path*"
  ]
}
```

You believe:

```text
/dashboard
/dashboard/settings
/dashboard/users
```

are protected.

But your application may expose related resources through:

```text
/api/dashboard
/_next/data/...
RSC requests
prefetch requests
rewritten paths
other route handlers
```

depending on your architecture and framework behavior.

The developer's mental model can become:

```text
"Everything under dashboard is protected."
```

while the actual request graph is:

```text
                 Application
                      │
          ┌───────────┼────────────┐
          │           │            │
        HTML         RSC          API
          │           │            │
          ▼           ▼            ▼
      protected?   protected?   protected?
```

If authorization only happens on one branch, another branch can become an unintended entry point.

---

# 12. Category 3 — Alternate request paths

Modern frameworks aren't just:

```text
GET /dashboard
```

They may also have:

```text
RSC requests
prefetch requests
data requests
rewrites
dynamic routes
internal routing
API endpoints
server actions
```

So your application's actual attack surface is larger than the visible browser URL.

This is exactly what some 2026 advisories demonstrated.

The segment-prefetch vulnerability, for example, involved transport-specific App Router requests that could reach protected content without the expected Middleware authorization check.

---

# 13. Category 4 — Trusting URL/path checks

Imagine:

```ts
if (pathname.startsWith("/admin")) {
   checkAdmin();
}
```

This looks reasonable.

But security based purely on:

```text
URL
pathname
route matcher
rewrite assumptions
```

can become fragile because the framework ultimately has to transform the request into an internal route representation.

If an attacker can manipulate how that representation is interpreted, your security check may be looking at a different thing from what the application eventually renders.

---

# 14. Category 5 — Authentication vs Authorization Confusion

This is one of the biggest application-level problems.

Authentication:

```text
WHO ARE YOU?
```

Authorization:

```text
WHAT ARE YOU ALLOWED TO DO?
```

Example:

```text
User:
Hardik

Role:
MEMBER
```

Authentication says:

```text
Hardik is logged in.
```

Authorization says:

```text
Hardik can view Trip 123.
Hardik cannot delete Trip 123.
Hardik cannot access Admin Panel.
```

Middleware might perform:

```text
"Is there a valid session?"
```

But that's not enough.

---

# 15. Resource-Level Authorization

Consider:

```text
GET /trips/123
```

Middleware sees:

```text
session = valid
```

Therefore:

```text
ALLOW
```

But Trip `123` belongs to:

```text
User B
```

while the current user is:

```text
User A
```

Now we have:

```text
Authentication:
       PASS

Authorization:
       FAIL
```

Therefore:

> **Being authenticated does not mean you're authorized to access the requested resource.**

---

# 16. Why Proxy Doesn't Eliminate the Problem

The new architecture:

```text
middleware.ts
       ↓
proxy.ts
```

does not change this fundamental security principle.

Proxy still sits at the request boundary.

Conceptually:

```text
                    REQUEST
                       │
                       ▼
                    proxy.ts
                       │
                       ▼
                  Next Router
                       │
                       ▼
              Server Component
                       │
                       ▼
                 Database
```

Proxy is therefore excellent for:

```text
"Should this request continue?"
```

But your actual business operation is:

```text
"Is this particular user allowed to perform this particular operation on this particular resource?"
```

That decision belongs closer to the protected resource.

---

# 17. Correct Production Architecture

A production-grade architecture should look like this:

```text
                         INTERNET
                            │
                            ▼
                       CDN / WAF
                            │
                            ▼
                        proxy.ts
                            │
                    Lightweight checks
                            │
              ┌─────────────┴────────────┐
              │                          │
           Reject                      Allow
              │                          │
              ▼                          ▼
            401/403                  Next Router
                                         │
                            ┌────────────┴────────────┐
                            │                         │
                            ▼                         ▼
                    Server Component           Route Handler
                            │                         │
                            └────────────┬────────────┘
                                         ▼
                                Authentication
                                         │
                                         ▼
                                Authorization
                                         │
                                         ▼
                                  Business Logic
                                         │
                                         ▼
                                     Database
```

The important part is:

```text
Proxy
  ↓
early gate

Server-side authorization
  ↓
actual security boundary
```

---

# 18. What Should Proxy Actually Do?

Good responsibilities:

```text
✓ Redirect unauthenticated users
✓ Basic session presence check
✓ Locale routing
✓ Tenant routing
✓ Feature flag routing
✓ A/B routing
✓ URL rewrite
✓ URL redirect
✓ Request metadata
✓ Lightweight request filtering
```

Avoid making it responsible for:

```text
✗ Complete RBAC
✗ Complex business rules
✗ Database-heavy authorization
✗ Resource ownership decisions
✗ Financial permissions
✗ Critical mutations
✗ Your only security boundary
```

---

# 19. Correct Authentication Architecture

Suppose you have:

```text
/dashboard
```

Proxy can do:

```text
Request
   ↓
Proxy
   ↓
Session exists?
   │
   ├── NO → /login
   │
   └── YES
          ↓
       Dashboard
```

Then the server-side code can verify the session again.

Conceptually:

```ts
const session = await getSession();

if (!session) {
  redirect("/login");
}
```

This gives you defense in depth.

---

# 20. Correct Authorization Architecture

Suppose:

```text
PATCH /trips/123
```

The server should perform:

```text
1. Identify user
2. Verify session
3. Load Trip 123
4. Check ownership/membership
5. Check role
6. Check requested operation
7. Perform mutation
```

Conceptually:

```text
PATCH /trips/123
        │
        ▼
    Controller
        │
        ▼
 Authentication
        │
        ▼
 Authorization
        │
        ▼
Trip membership?
        │
   ┌────┴────┐
   │         │
  NO        YES
   │         │
 403         ▼
          Role?
            │
        ┌───┴────┐
        │        │
       NO       YES
        │        │
       403       ▼
              Business
               logic
                 │
                 ▼
              Database
```

---

# 21. For Your Toor Master Architecture

Your architecture is particularly easy to apply this to.

You have:

```text
React Native
      ↓
NestJS
      ↓
Prisma
      ↓
PostgreSQL
```

If you add a Next.js web application:

```text
                    Browser
                       │
                       ▼
                    Next.js
                       │
                ┌──────┴──────┐
                │             │
             proxy.ts      App Router
                │             │
                │       Server Components
                │       Client Components
                │             │
                └──────┬──────┘
                       │
                       ▼
                    NestJS API
                       │
                 Authentication
                       │
                 Authorization
                       │
                  Trip Service
                       │
                     Prisma
                       │
                  PostgreSQL
```

This is a very strong architecture.

---

# 22. Example: Toor Master Trip Security

Suppose:

```text
GET /trips/123
```

User is:

```text
User A
```

Trip:

```text
Trip 123
Owner = User B
```

Proxy:

```text
User has session?
       │
      YES
       │
       ▼
Allow request
```

Then NestJS:

```text
Who is user?
       │
       ▼
User A
       │
       ▼
Who owns Trip 123?
       │
       ▼
User B
       │
       ▼
Does User A have membership?
       │
       ├── NO → 403
       │
       └── YES → continue
```

This means even if:

```text
Proxy bypass
```

ever occurs, your database/business layer still says:

```text
User A cannot access Trip 123.
```

That is defense in depth.

---

# 23. Vulnerable Architecture

A vulnerable architecture looks like:

```text
Browser
   │
   ▼
Proxy
   │
   │ "authenticated?"
   │
   ▼
Protected Page
   │
   ▼
Database
```

The problem is:

```text
Proxy
   =
ONLY security boundary
```

If Proxy is bypassed:

```text
Attacker
   ↓
bypass Proxy
   ↓
Protected Page
   ↓
Database
   ↓
Sensitive data
```

---

# 24. Secure Architecture

A much safer design:

```text
Browser
   │
   ▼
Proxy
   │
   │ early check
   ▼
Protected Page
   │
   ▼
Server-side auth
   │
   ▼
Authorization
   │
   ▼
Business rules
   │
   ▼
Database
```

Now if Proxy is bypassed:

```text
Attacker
   ↓
Proxy bypass
   ↓
Protected Page
   ↓
Server-side authorization
   ↓
403 Forbidden
```

The vulnerability becomes much less catastrophic.

---

# 25. The Principle: Defense in Depth

This is the most important security principle here.

Don't build:

```text
       Proxy
         │
         ▼
      DATABASE
```

Build:

```text
             Request
                │
                ▼
             Proxy
                │
                ▼
         Authentication
                │
                ▼
         Authorization
                │
                ▼
          Business Rules
                │
                ▼
             Database
```

Each layer assumes:

> **The layer before me might be wrong.**

This is defense in depth.

---

# 26. Why Database-Level Protection Can Be Even Better

For highly sensitive applications, you can go further.

For example:

```text
Application
     │
     ▼
Authorization
     │
     ▼
Database
     │
     ▼
Row-level security / ownership constraints
```

Then even if application code makes a mistake, the database can provide another enforcement layer.

This is especially relevant for:

```text
financial systems
healthcare
multi-tenant SaaS
enterprise applications
high-value resources
```

---

# 27. Never Trust the Client

This rule applies everywhere.

Never trust:

```text
button visibility
React state
hidden UI
URL
query parameter
localStorage
client role
client permissions
```

For example:

```tsx
{user.role === "ADMIN" && (
  <DeleteButton />
)}
```

This is only UX.

It does NOT provide security.

An attacker can simply call:

```text
DELETE /users/123
```

directly.

Therefore:

```text
UI permission
       ≠
API permission
```

---

# 28. Server Action Security

This is also important with App Router.

Consider:

```ts
"use server";

export async function deleteTrip(tripId: string) {
  await db.trip.delete({
    where: { id: tripId }
  });
}
```

Do NOT assume:

```text
"use server"
```

means:

```text
secure
```

A Server Function/Action is still an externally reachable server operation.

It should conceptually do:

```text
Server Action
     │
     ▼
Authenticate
     │
     ▼
Authorize
     │
     ▼
Validate input
     │
     ▼
Business logic
     │
     ▼
Database
```

---

# 29. The Same Principle Applies to Route Handlers

Don't do:

```ts
export async function DELETE() {
  await db.trip.delete(...)
}
```

without authorization.

Instead:

```text
DELETE /api/trips/123
           │
           ▼
       authenticate
           │
           ▼
       authorize
           │
           ▼
      validate trip
           │
           ▼
       delete trip
```

---

# 30. Proxy Is an Optimization + Early Gate

A useful way to think about Proxy is:

> **Proxy helps stop obviously unauthorized requests early, but the actual protected operation must still defend itself.**

Example:

```text
Proxy:

"No session?"
       ↓
Don't waste time rendering dashboard.
       ↓
Redirect login.
```

Then:

```text
Server:

"Session exists?"
       ↓
"Does this user own this resource?"
       ↓
"Does this role allow this operation?"
       ↓
Proceed.
```

This is both:

```text
performance optimization
+
security defense
```

---

# 31. Vulnerable vs Secure Flow

## Vulnerable

```text
             Request
                │
                ▼
             Proxy
                │
           Auth check
                │
                ▼
             Page
                │
                ▼
            Database
```

Security assumption:

```text
"If Proxy ran, we're safe."
```

Problem:

```text
Proxy vulnerability
        OR
matcher mistake
        OR
alternate request path
        OR
framework routing bug
        ↓
Authorization bypass
```

---

# 32. Secure

```text
                    Request
                       │
                       ▼
                    Proxy
                       │
                Early auth check
                       │
                       ▼
                    Router
                       │
                       ▼
               Server-side code
                       │
                       ▼
                 Authentication
                       │
                       ▼
                 Authorization
                       │
                       ▼
                Resource ownership
                       │
                       ▼
                 Business logic
                       │
                       ▼
                    Database
```

Security assumption:

```text
"Every sensitive operation verifies authorization."
```

That's the correct assumption.

---

# 33. What Should You Do With Existing Next.js Applications?

If you have an older application using:

```text
middleware.ts
```

don't immediately rewrite everything.

Instead:

### Step 1

Check your Next.js version.

```bash
npm list next
```

### Step 2

Check Next.js security advisories.

Upgrade to a currently supported patched release.

### Step 3

Search your codebase for:

```text
middleware.ts
proxy.ts
```

and determine whether they are doing:

```text
authentication
authorization
routing
rewrites
```

### Step 4

Search for protected operations:

```text
DELETE
PATCH
POST
PUT
```

and verify that those operations perform their own authorization.

### Step 5

Check Route Handlers:

```text
app/**/route.ts
```

### Step 6

Check Server Actions:

```text
"use server"
```

### Step 7

Check database access.

Ask:

> "Can this database operation execute if someone bypasses the UI and directly invokes the server endpoint?"

If the answer is:

```text
YES
```

you probably have an authorization problem.

---

# 34. Security Checklist

## Proxy

```text
[ ] Proxy is lightweight
[ ] matcher is explicitly understood
[ ] no critical authorization dependency exists only here
[ ] no unnecessary database queries
[ ] no sensitive business logic
```

## Authentication

```text
[ ] Session/token is validated server-side
[ ] Cookies are configured securely
[ ] Expiration is enforced
[ ] Token/session cannot be forged
```

## Authorization

```text
[ ] Every protected mutation checks authorization
[ ] Resource ownership is verified
[ ] RBAC is enforced server-side
[ ] Users cannot modify arbitrary IDs
[ ] API endpoints perform authorization independently
```

## Server Actions

```text
[ ] Every action authenticates
[ ] Every action authorizes
[ ] Input is validated
[ ] Sensitive actions do not trust client data
```

## Route Handlers

```text
[ ] Authentication
[ ] Authorization
[ ] Input validation
[ ] Rate limiting where appropriate
[ ] Correct HTTP status codes
```

## Dependencies

```text
[ ] Next.js is patched
[ ] Security advisories are monitored
[ ] npm audit/dependency scanning is used
[ ] Production versions are updated regularly
```

---

# 35. Interview-Ready Explanation

If an interviewer asks:

> **"Can Next.js Middleware be bypassed?"**

A strong senior-level answer would be:

> "Yes. There have been historical Next.js vulnerabilities where Middleware-based authorization could be bypassed through specially crafted requests or alternate routing mechanisms. For example, CVE-2025-29927 allowed Middleware authorization to be bypassed using a crafted request header, and 2026 advisories involved App Router RSC/segment-prefetch requests and dynamic route parameter handling. These issues were patched in the affected releases. But the broader architectural lesson is more important: I don't treat Middleware or Proxy as my only authorization boundary. I use it for early request interception and redirects, while authentication and especially resource-level authorization are enforced in the server-side route, service/data-access layer, or backend. That gives us defense in depth."

That is a much better answer than:

> "Middleware is insecure."

Because **Middleware isn't inherently insecure**.

The real problem is:

```text
Middleware
   =
ONLY authorization boundary
```

---

# 36. One Sentence to Remember

If you remember only one sentence from this document:

> **Proxy can decide whether a request should proceed, but the server-side operation must decide whether the authenticated user is actually allowed to perform the requested action on the requested resource.**

---

# 37. Final Mental Model

Think of your architecture as a building.

```text
                 BUILDING
                    │
                    ▼
              Security Gate
                proxy.ts
                    │
             "Can you enter?"
                    │
                    ▼
              Reception
                    │
            Authentication
             "Who are you?"
                    │
                    ▼
             Authorization
          "What can you access?"
                    │
                    ▼
              Business Logic
           "What can you do?"
                    │
                    ▼
               Database
             "Source of truth"
```

A security gate is useful.

But a building doesn't become secure merely because it has a front gate.

If someone somehow gets past the gate:

```text
Front gate bypass
      ↓
Reception
      ↓
Authorization
      ↓
Access denied
```

That is the architecture you want.

---

## Bottom Line

### Old misconception

```text
middleware.ts
     ↓
authentication
     ↓
safe
```

### New misconception

```text
proxy.ts
     ↓
authentication
     ↓
safe
```

### Correct production architecture

```text
proxy.ts
    ↓
early request filtering
    ↓
authentication
    ↓
authorization
    ↓
resource ownership
    ↓
business logic
    ↓
database
```

The rename from `middleware.ts` to `proxy.ts` does **not** magically solve authorization bypasses. The important change is understanding Proxy as a request-boundary mechanism rather than treating it as your application's ultimate security boundary.

As of the latest security information checked for this document, Next.js `16.2.11` is particularly important because it includes the fix for the July 2026 App Router/Turbopack/i18n Middleware/Proxy authentication-bypass advisory. Always verify the currently supported security release before deploying rather than treating a specific version number as permanently safe.



<!-- ********************************************************************************
********************************************************************************
******************************************************************************** -->



Yes — your security concern is correct, but one detail needs clarification.

A Server Action is a server-side endpoint/function invocation. You should not assume that Proxy is the security boundary for it.

Think:

Browser
   │
   ▼
Server Action
   │
   ├── authenticate
   ├── authorize
   ├── validate input
   │
   ▼
Database

Even if your request normally passes through:

Browser → Proxy → Server Action

your Server Action itself must be secure.

Example

❌ Vulnerable:

"use server";

export async function deleteTrip(tripId: string) {
  await db.trip.delete({
    where: { id: tripId }
  });
}

If someone can invoke that server-side operation without the proper authorization check, they may delete a trip they shouldn't.

✅ Better:

"use server";

export async function deleteTrip(tripId: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const trip = await db.trip.findUnique({
    where: { id: tripId }
  });

  if (trip?.ownerId !== user.id) {
    throw new Error("Forbidden");
  }

  await db.trip.delete({
    where: { id: tripId }
  });
}

So remember:

Proxy can provide an early gate, but Server Actions, Route Handlers, and other server-side entry points must enforce their own authorization.

The important mental model is:

Proxy = early protection
Server Action = actual operation
Authorization = must happen at/near the operation

And don't rely on the UI either:

"Delete" button hidden
       ≠
Delete operation secured

An attacker can bypass your UI entirely and target the server-side operation.



<!-- ********************************************************************************
********************************************************************************
******************************************************************************** -->