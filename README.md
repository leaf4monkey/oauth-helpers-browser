# OAuth-Helpers-Browser

Help you create oauth packages rapidly.

## Installation

meteor add leaf4monkey:oauth-helpers-browser

## Getting Started

```js
import {Service} from 'leaf4monkey:oauth-helpers-browser';
import {_} from 'meteor/underscore';

let MyService = new Service('myService');

let getLoginUrl = function (config) {
  // return a login url;
};

MyService.initialize({
  login: {
    meteorPropName: 'loginWithMyService',
    func: function(options, callback) {
      // You need not do this, I do.
      // if (! callback && typeof options === 'function') {
      //   callback = options;
      //   options = {};
      // }

      // You need not do this, I do.
      // let callback = Accounts.oauth.credentialRequestCompleteHandler(callback);
      MyService.requestCredential(options, callback);
    }
  },
  requestCredential (options, credentialRequestCompleteCallback) {
    let config = this.getConfigsWithLoginStyle(options);
    if (!config) {
      Service.serviceConfigurationError(credentialRequestCompleteCallback);
      return;
    }

    let credentialToken = Random.secret();

    let {loginStyle} = config;

    let loginUrl = getLoginUrl(config);

    this.launchLogin({
      loginStyle: loginStyle,
      loginUrl: loginUrl,
      credentialRequestCompleteCallback: credentialRequestCompleteCallback,
      credentialToken: credentialToken
    });

  }
});
```

**Or simply**

```js
import Service from 'leaf4monkey:oauth-helpers-browser';
import {Random} from 'meteor/random';

let MyService = new Service('myService');

MyService.initialize({
  launchLoginOptions: (loginParams, options) => {
    // extend login params.
  },
  createCredentialToken: () => Random.secret(),
  constructLoginUrl (config) {
    // construct your login url.
  }
});
```

## Apis

#### `constructor(serviceName)`

Nothing but initialize you service name.


#### `serviceConfigurationError(callback)`

Shorthand of `callback && callback(new ServiceConfiguration.ConfigError())`;


#### `getConfigs(fields)`

Shorthand of:

```js
ServiceConfiguration.configurations.findOne({service: this.serviceName}, {fields});
```


#### `#_redirectUrl`

Shorthand of `OAuth._redirectUri(serviceName, config, params, absoluteUrlOptions)`.


#### `#_loginStyle(configs, options)`

Shorthand of `OAuth._loginStyle(this.serviceName, configs, options)`.


#### `#getConfigsWithLoginStyle(options, fields)`

Shorthand of:

```js
let configs = this.getConfigs(fields);
if (configs) {
  configs.loginStyle = this._loginStyle(configs, options);
}
```


#### `#initialize(options)`

###### `options`

Match with:

```js
Match.ObjectIncluding({
  meteorPropName: Match.Optional(String),
  login: Match.Optional(Function),
  requestCredential: Function
})
```

**or**

```js
Match.ObjectIncluding({
  meteorPropName: Match.Optional(String),
  login: Match.Optional(Function),
  launchLoginOptions: Match.Optional(Function),
  createCredentialToken: Function,
  constructLoginUrl: Function
})
```

###### `options.login(options, callback) function`

Register login method on `Service` instance. If undefined, a default one will be set, which is for most scenarios.

###### `options.meteorPropName string`

Register login method on `Meteor`, default `loginWith<toCamelCase(ServiceName)>`.

###### `options.requestCredential(options, callback) function`

Register method `requestCredential()` on `Service` instance.

###### `options.launchLoginOptions(loginParams, options) function`

Handle login params before login action be launched.
- `loginParams`
The argument passed in `OAuth.launchLogin()`, has `'loginStyle'`, `'loginUrl'`, `'credentialRequestCompleteCallback'`, `'credentialToken'` and `'loginService'` properties already.
- `options`
The argument passed in `Meteor.loginWith<Service>()`

###### `options.createCredentialToken() function`

Define a `credentialToken` generator, default `() => Random.secret()`.

###### `options.constructLoginUrl(config, credentialToken, options) function`

Construct your login url with current service configuration.

- `config object`

The result of `this.getConfigsWithLoginStyle(options)` or `this.getConfigs(options)`.

- `loginParams object`

The argument passed in `OAuth.lauchLogin()`.

- `options object`

The argument passed in `Meteor.loginWith<Service>()`.
