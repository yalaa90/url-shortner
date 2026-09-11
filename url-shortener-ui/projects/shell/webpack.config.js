const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  remotes: {
    authRemote: 'http://localhost:4201/remoteEntry.js',
    linksRemote: 'http://localhost:4202/remoteEntry.js',
    analyticsRemote: 'http://localhost:4203/remoteEntry.js',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
