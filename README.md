# Unstack

NOTE: Unstack is in alpha and this README is a work in progress.

Unstack is a framework centered around the belief that the development of a software platform should be sustainable.

A sustainable software platform is one where its codebase and infrastructure should make it exceedingly easy for developers to deliver continued business-value over time, at any scale.

To be sustainable, a platform must operate in a financially lean and technically flexible fashion.

These are two principles that enable this:

1. Human-centered UX -- especially for teams
2. Declarative code -- when it matters
   For as long as possible, a team's platform code should not be tied to or made aware of specific architectural patterns, tooling and providers.

99 percent of software platforms today consists of:

- actors (users, admins, API users, etc)
- a conceptually "single source of truth" data-store
- UIs (web, mobile, email, voice, sms, etc.) and APIs

Generally, those _actors_ use _UIs_ and _APIs_ to query or mutate a _data-store_.

With that fact in mind, to achieve the above rules, Unstack provides two main offerings:

1. Unstack Core: easy-to-use and extensible tooling for developing, testing and deploying platform services (UIs, APIs, etc)
2. Unstack Managed: easy-to-adopt architectural patterns and related libraries that provide built-in scaling and unlock access to advanced platform-centric functionality.

By just using Unstack Core, you get the following:

- a service-based "majestic monolith" development model
- a unified local development setup (`unstack start`, `unstack test`)
- a remote store for sensitive application data like secrets
- automatic staging/production/review environments on multiple cloud providers

The above can go a long way in reducing the resources required to build sustainable software.

However to build a web-scale platform, more care must be taken in its architecture. That's where Unstack Managed really shines.

_More to come on Native soon._

## Core

## The Development Flow

1. Self-contained local development environment
2. Production-like review environments
3. Test-driven automated release cycle

Via commands:

1. `unstack install`
2. `unstack start`
3. `unstack test --watch`
4. `git commit -m "message" && git push`
5. on push, get all your services in a temp environment for review
6. merge master, staging environment is updated
7. manually or automatically approve deploy to production

### Technical concepts

- The Context Platform
  - Environments
  - Secrets
  - Workflows
  - Networking
- Services
  - Components
  - Handlers
  - Middleware
- Builders
- Providers
  - Runtimes

### Services

A service:

- has a type
- is made up of a Component and a chosen Handler
- produces a folder to be given to one or more builders.
- inputs/outputs
- defines inputs required from current context and outputs to add to current context

### Services

base artifact types

- http
- worker
- package
- custom

### Providers

Providers are external services like AWS, Azure, or Heroku, that take some (or all) of code and config and help serve it to end users.

Generally, Providers host Unstack services via Runtimes, but can also be used to configure/manage things like DNS, or to release new iOS builds.

#### Runtimes

Runtimes are conceptually self-contained compute stacks that are deployed with production-ready resources for a given provider. A Runtime builds on top of the tools of a provider, providing sensible defaults and conforming to Unstack standards, giving automatic interoperability.

For example, an Unstack Service that outputs an an HTTP Artifact could be deployed on the `aws-elastic-beanstalk` Provider via the `docker-http` Runtime.

#### Orchestrators
