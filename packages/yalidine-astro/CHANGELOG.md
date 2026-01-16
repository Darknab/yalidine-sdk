# Changelog

All notable changes to this project will be documented in this file.
This project adheres to Semantic Versioning.

## [0.2.1] – 2026-01-16
### Security
- Patched transitive vulnerabilities in `devalue` and `h3`.

## [0.2.0] – 2025-12-29
### Changed
- Breaking: External API secrets are no longer configured inside `yalidine-astro`; they are directly read from environment variables in `yalidine-sdk` to avoid being accidentaly exposed to the client-side.

## [0.1.0]
- Initial release