# Audit public documentation content and Markdown/MDX pipeline

## Goal

Before implementing the Goalstery public Help & Support, Privacy Policy, and Terms of Use pages, audit the existing repository and report what infrastructure and content already exist.

This is a **research/audit-only task**. Do not implement routes, components, dependencies, content migrations, or refactors yet.

## Context

We plan to expose these public application routes later:

- `Help & Support` → `/help`
- `Privacy Policy` → `/privacy`
- `Terms of Use` → `/terms`

The intended direction is to keep product-facing documentation/legal content separate from engineering documentation and render it through the application. However, we must first understand what the repository already provides so we do not create a duplicate Markdown/MDX pipeline, duplicate documents, or conflicting architecture.

## Audit scope

### 1. Markdown / MDX infrastructure

Inspect the repository and determine whether Markdown or MDX is already supported anywhere in the application or build pipeline.

Check at least:

- `package.json` and lockfile dependencies;
- Next.js configuration;
- webpack/Turbopack configuration if present;
- existing `.md` and `.mdx` imports;
- Markdown/MDX rendering components;
- parsers/renderers such as `@next/mdx`, `next-mdx-remote`, `react-markdown`, `remark`, `rehype`, `gray-matter`, or equivalents;
- frontmatter handling;
- content-loading utilities/services;
- static generation/build-time content loading;
- typography/content styles already intended for rendered documents;
- sanitization/security handling for rendered Markdown/HTML, if applicable.

Do not assume a package is used merely because it is installed. Trace actual usage.

### 2. Existing Help / Privacy / Terms content

Search the **entire repository**, not only `docs/`, for existing user-facing content corresponding to:

- Help & Support;
- support/help/FAQ documentation;
- Privacy Policy / Privacy Notice;
- Terms of Use / Terms of Service;
- legal notices that could form part of Privacy or Terms.

Search by both filenames and content/phrases. Include likely variants such as `help`, `support`, `faq`, `privacy`, `policy`, `terms`, `legal`, `tos`, etc.

For every relevant source found, report:

- exact repository path;
- what it contains;
- whether it appears user-facing, engineering-only, placeholder, or obsolete;
- whether it can reasonably serve as the source of truth for one of the planned public pages;
- whether there are duplicate or conflicting versions.

### 3. Existing UI buttons and navigation

Locate the current `Help & Support`, `Privacy Policy`, and `Terms of Use` controls in the UI.

Report:

- component/file paths;
- current implementation (`button`, `a`, `Link`, handler, etc.);
- current destination or behavior;
- whether the controls live inside authenticated AppShell/navigation/settings/profile UI;
- any routing/layout implications relevant to later wiring them to `/help`, `/privacy`, and `/terms`.

Do not modify them.

### 4. Existing routing/layout conventions

Inspect how this project currently implements public routes and standalone pages.

Identify:

- whether the application uses Next.js App Router, Pages Router, or another routing arrangement;
- auth middleware/guards that could affect `/help`, `/privacy`, `/terms`;
- existing public routes that are good architectural references;
- layout conventions for pages outside the main authenticated AppShell;
- metadata/SEO conventions relevant to public static pages.

### 5. Repository conventions

Check project documentation/specifications that govern:

- component/file organization;
- default vs named exports;
- styling/theme conventions;
- route/page organization;
- documentation/content organization.

Use the project's existing rules as the basis for the recommendation rather than introducing a new convention unnecessarily.

## Required output

Return an audit report in the Codex response. Do **not** create implementation files.

Use this structure:

### A. Current Markdown/MDX pipeline

State clearly one of:

- an existing pipeline is present and suitable;
- an existing pipeline is present but insufficient;
- no application Markdown/MDX pipeline exists.

Then list the concrete files/dependencies/usages supporting that conclusion.

### B. Existing content

For each of Help, Privacy, and Terms, list all relevant existing sources and classify them.

If nothing exists for a category, explicitly say so.

### C. Existing UI entry points

List the exact files/components containing the three controls and describe their current behavior.

### D. Public routing/auth findings

Explain what must be considered to make `/help`, `/privacy`, and `/terms` publicly accessible later.

### E. Recommended implementation direction

Based strictly on the repository findings, recommend the smallest clean implementation for the later task.

In particular, answer:

1. Should we reuse an existing Markdown/MDX pipeline or introduce one?
2. Where should the canonical Help/Privacy/Terms source files live given the repository's current structure?
3. Should any existing documents be reused/moved instead of duplicated?
4. What shared page/document component, if any, should be reused or introduced later?
5. What existing public layout should these pages use or emulate?
6. Are any dependencies actually required for the later implementation?

### F. Proposed change set — no implementation

Give a concise proposed file-level plan for the subsequent implementation task:

- files likely to create;
- files likely to modify;
- files/content likely to move or reuse;
- dependencies, only if truly necessary.

Mark uncertain items explicitly.

## Constraints

- Do not implement the feature.
- Do not install packages.
- Do not change routes.
- Do not move or rewrite documentation.
- Do not modify the three UI controls.
- Do not run broad automated formatting that changes unrelated files.
- Do not create a parallel content pipeline merely to demonstrate an approach.
- Base every conclusion on repository evidence and include exact paths.
- If repository documentation conflicts with an apparent code convention, call out the conflict rather than silently choosing one.

## Deliverable

The deliverable is the Codex audit response only. We will use that response to define the separate implementation task.
