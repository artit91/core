Service Layer Implementation
============
```typescript
/**
 * User service
 */
@Service
@Authenticate
export class User {
    /**
     * Gets own user data
     */
    public static me: IService<IUser> = async(event, context) => {
        return <IUser>context.user;
    }
    /**
     * Gets others user data
     */
    @Require('userId')
    public static fetch: IService<IUser> = async(event, context) => {
        const userDao: IUserDao = new UserDao(context);
        let user: IUser | void;

        user = await userDao.byId(event.userId);

        if (!user) {
            throw new Exception(
                Errors.NotFound,
                'user_not_found',
                { userId: event.userId }
            );
        }

        return user;
    }
}
```


How to Run
------------
The example project requires a unix system and `MongoDB` on `localhost`.

```bash
yarn install
./start.sh
```

Table of Contents
-----------------
* Introduction
* Services
* Stateful, Stateless
* Event, Context
* Entities
* DAO-s
* Resources
* Difference between Resource and DAO
* Validators and Parsers
* Exceptions
* Logging
* Open Connections
* Environments
* Configurations
* Mocking
* Testing
* Build Systems

Introduction
------------
I wrote services for the first time in 2010 using EJB (Enterprise Java Bean) and found it painful to use it, but the idea in itself was very good: encapsulating business logics from the currently hyped web framework.

I wanted to do something similar without pain and caring about containers, protocols, servers or serverless while I'm writing plain business logics.

A real service layer is maintainable, testable, easy to develop, run and adopt by juniors. This little library helps you get started.

Services
--------
Service is a procedure that does something meaningful in a system. Nothing more, nothing less.

Stateful, Stateless
-------------------
Services should not hold a state between calls because it makes testing, debugging, and scaling hard.

Guaranteeing stateless behaviour everywhere is also painful and leads to long code and unenforceable code conventions. In your service code, you can use stateful objects that shorten code, improves readability, performance, etc.

Event, Context
--------------
Every service should have two arguments: event and context.

An event is just a dictionary of arguments to your procedure. Every argument of your service can be a string or undefined, which makes null checking easy and forces you to validate and parse input.

Event dictionary must be flat. Validating, parsing complex structures are hard and makes your service difficult to call and test that leads to black box like software.

Context contains all external states of a service and makes testing, injecting dependencies, evading statefulness relatively easy.

Entities
--------
* All plain objects must have a descriptor in every system.
* Use composition over inheritance to evade most of the null checks.
* Not all entities are stored.
* Services return entities, errors or nothing.

DAO-s
-----
DAO-s (Data access objects) decide how to store and obtain your entities. Only DAO-s can create and mutate your entity objects to prevent mutation code in the wrong place.

Use external software to manage and migrate your data source (e.g. tables, collections) and treat data as existing before you wrote your application. Never create or modify any schema in runtime. Just don't.

Resources
---------
Resources should be created just before your service being called and destroyed just before your serviced returned its result.

For example, calling a service 2 times should make 2 MongoDB connections and close them before they return.

Resource locking and pooling are not your services' job.

You shouldn't use a service from a service; instead, make a third one where you composite functionality. It prevents rewriting all of your tests for each iteration of your product and forces you to duplicate some of your code, such as calling validators and parsers to evade complex routing logics in your services.

Difference between Resource and DAO
-----------------------------------
A resource shouldn't have any resource dependency.

DAO without resource dependency can be a resource and injected into the context.

Validators and Parsers
----------------------
Use validators and parsers to validate and parse the event object.

In your services, you shouldn't validate against or parse into any resource specific formats (e.g. ObjectID).

DAO-s task to validate and parse resource specific stuff.

Exceptions
----------
DAO-s shouldn't throw Exceptions to prevent untestable behaviours (resources can throw).

An error message should be a readable template name that can easily be localized. Parameters should be included for the template if any.

Use your own error codes and don't use 0 as an error code.

Logging
-------
Every log message should contain a timestamp, level, logger name, message, and payload if any.

Don't write useless log messages everywhere and don’t forget to remove them if you wrote them for debugging purposes.

Error level is for errors in your system and NOT user generated errors.
Warn is a warning from your resources and DAO-s (e.g. "I'm running out of memory.").

Info is for event logging if something meaningful happened in your system (e.g. "John deleted a resource."). Don't forget to give names to your events in the payload so you can draw nice graphs from them.

Debug log is for partial results or errors caused by incorrect input.

Treat errors and warnings as very serious issues and fix them ASAP.

Open Connections
----------------
If a connection is persistent, then the connection should be managed outside of the service layer, and a resource should be made to access it.

Environments
------------
Don't use environments because it makes proper testing impossible. Changing environment should be just a config change. Writing ENV variables also makes things harder to debug and port. Don't distinguish production from development in any of your algorithms.

Configurations
--------------
Use a single configuration file or composite them into a single file in runtime and never store production configuration in git. Testing services should not use any configuration file, so you shouldn't import configuration in your service logics.

Mocking
-------
For testing services, DAO-s and resources should be mocked and just test the raw business logics.

For testing DAO-s, resources should be mocked.

Testing
-------
Testing your procedures is the most important part of your tests because they are public.

DAO-s are also very important to test, but they are often rewritten after a few months.

Build Systems
------------
Your project building process should be managed by scripts you can easily modify. Dependencies of the services, DAO-s, resources and the layer above should be different.
