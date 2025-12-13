# Yalidine SDK Documentation

## Overview

Yalidine SDK provides a set of helpers and utilities to integrate Yalidine shipping and delivery services into your applications. It is framework-agnostic, with dedicated integration packages available for popular front-end and server frameworks.

The SDK handles tasks such as:

* Parcel creation and management
* Fee calculation
* Delivery tracking
* Data validation and caching

This documentation is organized into two main sections: **Core SDK helpers** and **Framework integrations**.

---

## Core SDK

The core SDK includes all domain-level functionality, independent of any framework. Start here if you want to understand how the API helpers work:

* [Helpers Reference](./helpers.md)

---

## Integrations

We provide framework-specific integration packages that make it easy to configure and use the SDK in your projects. Each integration handles configuration, environment setup, and runtime compatibility:

* [Astro Integration](./integrations/astro.md)
* *React Integration (coming soon)*
* *Vue Integration (coming soon)*
* *Vite Integration (coming soon)*

---

## Getting Started

1. Install the core SDK or the desired integration package.
2. Configure API credentials and optional settings.
3. Call helpers from your server-side code or framework integration.

For detailed examples and reference, explore the **Core SDK** and **Integrations** sections above.
