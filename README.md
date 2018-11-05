# Unstack

NOTE: Unstack is in alpha and this README is a work in progress.

Unstack is a framework centered around the belief that the development of a software platform should be sustainable.

A sustainable software platform follows these rules:

1. A platform's codebase should be easy to develop further in the present _and_ be flexible enough to allow easy development in the future.
2. For as long as possible, a team should focus on what makes their platform unique, not what keeps it running.

99 percent of software platforms today consists of:

- actors (users, admins, API users, etc)
- a conceptually "single source of truth" data-store
- UIs (web, mobile, email, voice, sms, etc.) and APIs

Generally, those _actors_ use _UIs_ and _APIs_ to query or mutate a _data-store_.

With that fact in mind, to achieve the above rules, Unstack provides two main offerings:

1. Unstack Core: easy-to-use and extensible tooling for developing, testing and deploying platform services (UIs, APIs, etc)
2. Unstack Native: easy-to-adopt architectural patterns and related libraries that provide built-in scaling and unlock access to advanced platform-centric functionality.

By just using Unstack Core, you get the following:

- a service-based "majestic monolith" development model
- a unified local development setup (`unstack start`, `unstack test`)
- a remote store for sensitive application data like secrets
- automatic staging/production/review environments on multiple cloud providers

The above can go a long way in reducing the resources required to build sustainable software.

However to build a web-scale platform, more care must be taken in its architecture. That's where Unstack Native really shines.

_More to come on Native soon._

## Core

## The development flow

1. `unstack install`
2. `unstack start`
3. `unstack test --watch`
4. `git commit -m "message" && git push`
5. on push, get all your services in a temp environment for review
6. merge master, staging environment is updated
7. manually or automatically approve deploy to production

### Concepts

- Context
  - Environments
  - Secrets
- Services
  - Components
  - Handlers
  - Middleware
- Providers
  - Runtimes
  - Orchestrators

### Services

A service:

- has a type
- is made up of a Component and a chosen Handler
- produces artifacts during builds
- inputs/outputs
- defines inputs required from current context and outputs to add to current context

base artifact types

- http
- worker
- package
- custom

### Providers

Providers host Unstack services via Runtimes. Runtimes are conceptually self-contained compute stacks that are deployed with production-ready resources for a given provider. A Runtime builds on top of the tools of a provider, providing sensible defaults and conforming to Unstack standards, giving automatic interoperability.

For example, an Unstack Service that outputs an an HTTP Artifact could be deployed on the `aws-elastic-beanstalk` Provider via the `docker-http` Runtime.
