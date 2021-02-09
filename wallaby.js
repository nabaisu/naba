module.exports = function (wallaby) {

  return {
    files: ['src/**/*.js'],

    tests: ['__tests__/**/*.js'],

    env: {
      type: 'node',
      runner: 'node'
    },
    compilers: {
      '**/*.js': wallaby.compilers.babel({}),
    },
    testFramework: 'jest'
  };
};

