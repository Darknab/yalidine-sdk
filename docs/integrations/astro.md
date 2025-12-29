# Yalidine Astro Integration

## Table of contents
1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Execution-model](#server-only-execution-model)
7. [Import-source](#import-source)
8. [Error-handling](#error-handling)
9. [caching](#caching)
10. [notes](#notes-and-caveats)
11. [related-documentation](#related-documentation)

## Overview

`yalidine-astro` is the official Astro integration for the Yalidine SDK. It provides a clean and framework-native way to configure `yalidine-sdk` in Astro projects by injecting the required configuration at build time.

This package **does not replace** `yalidine-sdk`. Instead, it acts as a thin integration layer that:

* Centralizes Yalidine configuration in `astro.config.mjs`
* Makes configuration available to the SDK via build-time injection
* Ensures predictable behavior across Astro runtimes

All business logic and API helpers remain in `yalidine-sdk`.

---

## Requirements

* **Astro**: `^4.0.0` or `^5.0.0`
* **Node.js**: A Node runtime compatible with your Astro version

> Note: The Yalidine API helpers are intended to run **server-side only**. Client-side execution is explicitly guarded against.

---

## Installation

```bash
npm install yalidine-astro
```

or

```bash
pnpm add yalidine-astro
```

or

```bash
yarn add yalidine-astro
```
> Note: The core SDK `yalidine-sdk` is included automatically, and you can import helpers directly from it as needed.

---

## Configuration

Add the Yalidine integration to your `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import yalidineIntegration from "yalidine-astro";

export default defineConfig({
  integrations: [
    yalidineIntegration({
      apiUrl: "https://api.yalidine.com/v1",
      cacheDefault: "memory",
      cacheLifeTime: 1  //in days
    })
  ],
  vite: {
    ssr: {
      noExternal: ['yalidine-sdk']
    }
  }
});
```

### Configuration options

| Option           | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `apiUrl`         | Base API URL (defaults to `https://api.yalidine.com/v1`) |
| `startingCenter` | Default starting center ID                               |
| `startingWilaya` | Default starting wilaya ID                               |
| `cacheDefault`   | Cache strategy (`memory` by default)                     |
| `cacheLifeTime`  | Cache lifetime (default: `1`)                            |

### Environment variables

The following environment variables are required to authenticate with the Yalidine API:

```env
YALIDINE_API_ID=your_api_id
YALIDINE_API_TOKEN=your_api_token
```
These variables must be available in your environment:

- In development: defined in a .env file

- In production: configured in your hosting provider or deployment environment

They are only used server-side and are never exposed to client-side code.

### Notes

> **Why credentials are not part of the config**
> 
> API credentials are intentionally read from environment variables instead of being passed to the integration. This avoids accidental exposure, keeps astro.config.mjs free of secrets, and aligns with Astro and Node.js best practices.

> Because yalidine-sdk integrates deeply with Astro’s build pipeline, it must be bundled during SSR. This is a standard requirement for Astro integrations that inject compile-time configuration.

> Changes to environment variables require restarting the Astro dev server.

---

## Usage

Once configured, you can use `yalidine-sdk` helpers directly in your **server-side Astro code**, such as API routes.

A common first use case is fetching the list of wilayas to populate a delivery form.

Example structure:

```
src/
  components/
    Form.astro
```

```astro
---
import { getWilayas } from "yalidine-sdk";

const wilayas = await getWilayas()
---

<select name="wilayas">
  <option value="">Select a wilaya</option>
  {wilayas.map((w) => (
    <option value={w.id}>{w.name}</option>
  ))}
</select>
```

This simple example demonstrates that the SDK is correctly configured and able to communicate with the Yalidine API.
> Note: Frontmatter in .astro files runs server-side, so it’s safe to call API helpers here.
---

## Server-only execution model

Most helpers in `yalidine-sdk` communicate with the Yalidine external API and are **server-only by design**.

To enforce this:

* Every API-dependent helper calls `ensureServer()` internally
* If executed in a client/browser context, an error is thrown immediately

This means:

* ✅ API routes
* ✅ Server-side rendering
* ❌ Client components
* ❌ Browser-only scripts

Pure helpers that do not communicate with the API may be used anywhere, but API helpers must never be bundled into client-side code.

---

## Import source

All low-level API helpers are provided by yalidine-sdk and must be imported directly from it.

The Astro integration is responsible for framework-level setup and configuration only, and does not re-export SDK helpers.

---

## Error handling

Helpers that interact with the API may throw errors in the following cases:

* Invalid or missing configuration
* Network or API errors
* Invalid payloads
* Client-side execution attempts

All errors thrown by the SDK are standard JavaScript `Error` instances.

You are expected to use standard `try/catch` blocks when calling helpers:

```js
try {
  const wilayas = await getWilayas();
} catch (error) {
  console.error(error);
}
```

Refer to the [core SDK documentation](../core/helpers.md) for detailed helper behavior.

---

## Caching

Some helpers in `yalidine-sdk` use internal caching to reduce redundant API calls.

Caching behavior can be configured at the Astro integration level using the following options:

* `cacheDefault`
* `cacheLifeTime`

For detailed information about which helpers use caching and how cache strategies behave, refer to the [core SDK documentation](../core/helpers.md).

---

## Notes and caveats

* This integration does **not** expose any Astro components
* Configuration is injected at build time using Vite `define`
* Changing credentials requires restarting the dev server
* The package is currently in **early development** and APIs may evolve

---

## Related documentation

* Core helpers and API behavior: [helpers](../core/helpers.md)
