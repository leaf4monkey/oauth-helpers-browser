var packageName = 'leaf4monkey:oauth-helpers-browser';
var mainModule = './lib/index.js';
var mainModuleEnv = 'web.browser';
var version = '0.0.8';

Package.describe({
  name: packageName,
  version: version,
  summary: 'Help you create oauth packages rapidly.',
  git: '',
  documentation: 'README.md'
});

var commonDependencies = function (api) {
  api.use('ecmascript');
  api.use('check', mainModuleEnv);

  // install `oauth1` or `oauth2` by yourself.
  api.use('oauth1', mainModuleEnv, {weak: true});
  api.use('oauth2', mainModuleEnv, {weak: true});

  api.use('random', mainModuleEnv);
  api.use('underscore', mainModuleEnv);

  api.use('leaf4monkey:oauth-helpers-common@' + version, mainModuleEnv);
};

Package.onUse(function(api) {
  api.versionsFrom('1.4.1');
  commonDependencies(api);

  api.mainModule(mainModule, mainModuleEnv);
});

//Package.onTest(function(api) {
//  commonDependencies(api);
//  api.use('tinytest');
//  api.addFiles(mainModule, mainModuleEnv);
//  api.mainModule('oauth-helpers-tests.js', mainModuleEnv);
//});
