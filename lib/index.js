/**
 * Created on 2017/5/6.
 * @fileoverview 请填写简要的文件说明.
 * @author joc (Chen Wen)
 */
import CommonService from 'meteor/leaf4monkey:oauth-helpers-common';
import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';
import {_} from 'meteor/underscore';
import {Random} from 'meteor/random';
import {OAuth} from 'meteor/oauth';
import {Accounts} from 'meteor/accounts-base';
import {ServiceConfiguration} from 'meteor/service-configuration';

let warpCredentialRequestCompleteHandler = callback => Accounts.oauth.credentialRequestCompleteHandler(callback);

let underscoreReg = /\_(\w)/g;
let upperCamelCase = serviceName => {
    let pattern;
    underscoreReg.lastIndex = 0;
    let _serviceName = '', crtIdx;
    do {
        crtIdx = underscoreReg.lastIndex;
        pattern = underscoreReg.exec(serviceName);
        if (pattern) {
            _serviceName += `${serviceName.slice(crtIdx, pattern.index)}${pattern[1].toUpperCase()}`;
        }
    } while (pattern);
    if (crtIdx >= 0) {
        _serviceName += serviceName.slice(crtIdx);
    }
    return _serviceName.substring(0, 1).toUpperCase() + _serviceName.substring(1);
};

class Service extends CommonService {
    constructor (serviceName) {
        super(serviceName);
        this.onInitializedCallbacks = [];
        this.setLoggingIn(false);
    }

    getConfigsWithLoginStyle (options, fields) {
        let configs = this.getConfigs(fields);
        if (configs) {
            configs.loginStyle = this._loginStyle(configs, options);
        }
        return configs;
    }

    loggingIn () {
        return this._loggingIn;
    }

    setLoggingIn (flag) {
        this._loggingIn = flag;
    }

    _setLogin ({meteorPropName, func}, wrapCallback) {
        let {serviceName} = this;
        meteorPropName = meteorPropName || `loginWith${upperCamelCase(serviceName)}`;
        func = func || this.requestCredential.bind(this);

        this.login = function (options, callback) {
            this.setLoggingIn(true);
            // support a callback without options
            if (! callback && _.isFunction(options)) {
                callback = options;
                options = null;
            }

            callback = wrapCallback ?
                       warpCredentialRequestCompleteHandler(callback) :
                       callback;

            this.credentialRequestCompleteHandler = callback;
            func.call(this, options, callback);
        };
        Meteor[meteorPropName] = this.login;
    }

    _defaultRequestCredential (options, credentialRequestCompleteCallback) {
        let config = this.getConfigsWithLoginStyle(options);
        if (!config) {
            Service.serviceConfigurationError(credentialRequestCompleteCallback);
            return;
        }

        let {loginStyle} = config;

        let credentialToken;
        if (options.credentialToken) {
            credentialToken = options.credentialToken;
        } else if (options.createCredentialToken) {
            credentialToken = options.createCredentialToken.call(this);
        } else {
            credentialToken = this.createCredentialToken();
        }

        let loginParams = {
            loginStyle,
            credentialToken,
            loginService: this.serviceName
        };

        let loginUrl = this.constructLoginUrl(config, _.clone(loginParams), options);

        if (_.isFunction(loginUrl)) {
            loginUrl = loginUrl(config);
        }
        loginParams.loginUrl = loginUrl;

        this.launchLogin({
            ...loginParams,
            credentialRequestCompleteCallback
        }, options);
    }

    _setRequestCredential (requestCredential) {
        requestCredential = requestCredential || this._defaultRequestCredential;
        this.requestCredential = function (options, callback) {
            // support both (options, callback) and (callback).
            options = options || {};
            if (!callback && _.isFunction(options)) {
                callback = options;
                options = {};
            }

            return requestCredential.call(this, options, callback);
        };
    };

    static credentialRequestErrorCallback (callback, error) {
        return callback && callback(error);
    }

    static serviceConfigurationError (callback) {
        return Service.credentialRequestErrorCallback(callback, new ServiceConfiguration.ConfigError());
    }

    static isMobile () {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
    }

    // config, options
    _loginStyle (config, options) {
        options = options || {};
        if (!config.loginStyle && !options.loginStyle) {
            options.loginStyle = Service.isMobile() && 'popup' || 'redirect';
        }

        return OAuth._loginStyle(this.serviceName, config, options);
    }

    // config, params, absoluteUrlOptions
    _redirectUrl (...args) {
        return OAuth._redirectUri(this.serviceName, ...args);
    }

    // default: options.serviceName = this.serviceName
    launchLogin (loginParams, options) {
        loginParams = loginParams || {};
        _.defaults(loginParams, {loginService: this.serviceName});
        if (this.launchLoginOptions) {
            loginParams = this.launchLoginOptions(loginParams, options) || loginParams;
        }
        return OAuth.launchLogin(loginParams);
    }

    initialize (options) {
        check(options, Match.OneOf(
            Match.ObjectIncluding({
                meteorPropName: Match.Optional(String),
                login: Match.Optional(Function),
                requestCredential: Function
            }),
            Match.ObjectIncluding({
                meteorPropName: Match.Optional(String),
                login: Match.Optional(Function),
                launchLoginOptions: Match.Optional(Function),
                createCredentialToken: Match.Optional(Function),
                constructLoginUrl: Function
            })
        ));

        this.launchLoginOptions = options.launchLoginOptions;
        this.createCredentialToken = options.createCredentialToken || (() => Random.secret());
        this.constructLoginUrl = options.constructLoginUrl;
        this._setRequestCredential(options.requestCredential);
        this._setLogin({
            meteorPropName: options.meteorPropName,
            func: options.login
        }, true);
    }

    initialized () {
        this._initialized = true;
        this.onInitializedCallbacks.forEach(callback => callback());
    }

    onInitialized (callback) {
        if (!Array.isArray(callback)) {
            callback = [callback];
        }
        this.onInitializedCallbacks.push(...callback);
    }

    isInitialized () {
        return !!this._initialized;
    }
}

export default Service;
