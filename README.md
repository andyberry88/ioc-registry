# IOC Registry

A registry that provides a single location to register modules or objects which can be then be retrieved by other modules in an app. This allows parts of a codebase to use a module (or 'service') which is provided by the app and for the implementation to be easily replaced during different runtimes, for example during testing. It also provides the beneft that features can be implemented in isolation from the dependency, relying only on an interface rather than implementation details.

The ideas for IOC registry were taken from the 'service registry' and 'alias registry' in [BladeRunnerJS](http://bladerunnerjs.org) but has been changed to provide a more generic solution which doesn't rely on specific bundling behaviour provided by the [BladeRunnerJS](http://bladerunnerjs.org) toolkit.

## Motivation

[`app-service-registry`](https://github.com/andyberry88/app-service-registry) and [`app-alias-registry`](https://github.com/andyberry88/app-alias-registry) were created during a dev week which aimed to demonstrate libraries written using [BladeRunnerJS](http://bladerunnerjs.org) could be used with [WebPack](https://webpack.github.io/) and other libraries from NPM. As new features were imagined for each project it was apparent that the feature set was almost identical and a single registry could be used to register both module implementation and object instances, hence `ioc-registry` was born.

It's also a good hobby project to write a Node library, investigate test tooling in Node and an opportunity write more code.
