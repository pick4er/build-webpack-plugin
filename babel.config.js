'use strict';

const nodeVersion = require('./utils/node-version');

function applyCache() {
  return process.env.NODE_ENV === 'development';
}

module.exports = (api) => {
  api.cache(applyCache());

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: nodeVersion,
          },
        },
      ],
      '@babel/preset-typescript',
    ],
  };
};
