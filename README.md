# Unstack [WIP README]

# development experience

- unified local development
- centralized secrets store
- automatic staging/production/review environments
- and more!

## steps

1. `unstack install`
2. `unstack start`
3. `unstack test --watch`
4. `git commit -m "message" && git push`
5. on push, get all your services in a temp environment for review
6. merge master, staging environment is updated
7. manually or automatically approve deploy to production

# core concepts

- context
- environments
- services
  - components
  - handlers
- providers
  - runtimes
  - orchestrators

# services

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

native service types

- web
- commander
- data store

# providers

Providers host Unstack services via Runtimes. Runtimes are conceptually self-contained compute stacks that are deployed with production-ready resources for a given provider. A Runtime builds on top of the tools of a provider, providing sensible defaults and conforming to Unstack standards, giving automatic interoperability.

For example, an Unstack Service that outputs an an HTTP Artifact could be deployed on the `aws-elastic-beanstalk` Provider via the `docker-http` Runtime.
