module.exports = function(config) {
    config.set({
        frameworks: ['browserify', 'jasmine'], 
        files: [
        'src/**/*.js',
        'test/**/*_spec.js'
        ],
        preprocessors: {
            'test/**/*.js': ['jshint', 'browserify'],
            'src/**/*.js': ['jshint', 'browserify', 'coverage']
        },
        browsers: ['PhantomJS'],
        reporters: ['coverage', 'coveralls'],
          // optionally, configure the reporter
          coverageReporter: {
            dir : 'coverage/',
            reporters: [
                { type: 'text-summary' },
                { type: 'json' },
                { type: 'html' },
                { type: 'lcov' }
            ]
          },
        browserify: {
        debug: true
        }
        })
       }