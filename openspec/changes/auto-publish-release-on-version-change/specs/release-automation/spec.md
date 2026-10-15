# Spec Delta

## Purpose

Automatically publishes a GitHub Release when the package version changes on the main branch, eliminating the need for manual release branch creation.

## ADDED Requirements

### Requirement: Auto-publish on version change

The system SHALL automatically publish a GitHub Release when a push to the `main` branch changes the `version` field in `package.json`.

#### Scenario: Version changed on push to main

- **WHEN** a push to `main` changes the `version` field in `package.json`
- **THEN** a GitHub Release is automatically published with the new version tag

#### Scenario: Version unchanged on push to main

- **WHEN** a push to `main` does not change the `version` field in `package.json`
- **THEN** no GitHub Release is published

### Requirement: Release content matches upstream

The published Release SHALL contain the same assets as the upstream repository's release, including platform binaries, JSON schemas, repomix XML bundles, and SHA256SUMS.

#### Scenario: Release assets uploaded

- **WHEN** a version-change Release is published
- **THEN** the Release includes Linux x64, Linux arm64, macOS arm64, macOS x64, and Windows x64 binaries, SHA256SUMS, config-schema.json, permissions-schema.json, mcp-schema.json, repomix-xml.zip, and install.sh

### Requirement: Direct publish without draft

The Release SHALL be published directly without requiring manual draft finalization.

#### Scenario: Release is immediately visible

- **WHEN** a version-change Release is published
- **THEN** the Release is publicly visible and not in draft state

### Requirement: Existing release branch workflow preserved

The existing `release/v*` branch workflow SHALL remain unchanged and continue to function independently.

#### Scenario: Release branch workflow unaffected

- **WHEN** a `release/v*` branch PR is merged to `main`
- **THEN** the existing draft-release → publish flow operates as before
