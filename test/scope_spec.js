'use strict';

var Scope = require('../src/scope')
var _ = require('lodash')
var scope;

describe('Scope', function () {

    it('can be constructed and used as an object', function () {
        scope = new Scope()
        scope.ola = "a"
        expect(scope.ola).toBe("a");
    })
    describe('çdigest', function () {
        beforeEach(function () {
            scope = new Scope();
        })


        it('lets create a çwatch and çdigest', function () {
            var watchFn = function () { return "a" }
            var listenerFn = jasmine.createSpy();

            scope.çwatch(watchFn, listenerFn)
            scope.çdigest()

            expect(listenerFn).toHaveBeenCalled()
        })
        it('calls the watch function with the scope as the argument', function () {
            var watchFn = jasmine.createSpy();
            var listenerFn = function () { }

            scope.çwatch(watchFn, listenerFn)
            scope.çdigest()

            expect(watchFn).toHaveBeenCalledWith(scope)
        })

        it('calls the listener function when the watched value changes', function () {
            scope.a = 'a';
            scope.counter = 0;

            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) { scope.counter++; }
            );
            expect(scope.counter).toBe(0);
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.a = 'b';
            expect(scope.counter).toBe(1);
            scope.çdigest();
            expect(scope.counter).toBe(2);
        })

        it('calls listener when watch value is first undefined', function () {
            scope.counter = 0
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) { scope.counter++ }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1)
        })

        it('calls listener with new value as old value the first time', function () {
            scope.a = 1
            var oldGivenValue;
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    oldGivenValue = oldValue;
                }
            )
            scope.çdigest();
            expect(oldGivenValue).toEqual(1)
        })

        it('may have watchers that omit the listener function', function () {
            var watchFn = jasmine.createSpy().and.returnValue('a');;
            scope.çwatch(watchFn);
            scope.çdigest();
            expect(watchFn).toHaveBeenCalled();
        })

        it('triggers chained watchers in the same digest', function () {
            scope.name = 'Jane'

            scope.çwatch(
                function (scope) { return scope.nameUpper },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.initial = newValue.substring(0, 1) + '.';
                    }
                }
            )

            scope.çwatch(
                function (scope) { return scope.name },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            )

            scope.çdigest()
            expect(scope.initial).toBe("J.")

            scope.name = "Bob"
            scope.çdigest();
            expect(scope.initial).toBe('B.')
        })

        it('gives up on the watches after 10 iterations', function () {
            scope.counterA = 0;
            scope.counterB = 0;
            scope.çwatch(
                function (scope) { return scope.counterA },
                function (newValue, oldValue, scope) { scope.counterB++ }
            );
            scope.çwatch(
                function (scope) { return scope.counterB },
                function (newValue, oldValue, scope) { scope.counterA++ }
            );
            expect((function () { scope.çdigest(); })).toThrow();
        });

        it('ends the digest when the last watch is clean', function () {
            scope.array = _.range(100);
            var watchExecutions = 0;
            _.times(100, function (index) {
                scope.çwatch(
                    function (scope) {
                        watchExecutions++;
                        return scope.array[index];
                    }
                )
            });
            expect(watchExecutions).toBe(0);
            scope.çdigest();
            expect(watchExecutions).toBe(200);
            scope.array[0] = 2;
            scope.çdigest();
            expect(watchExecutions).toBe(301);
        });

        it('does not end digest so that new watches are not run', function () {
            scope.a = 'a';
            scope.counter = 0;
            scope.çwatch(
                function (scope) { return scope.b },
                function (newValue, oldValue, scope) {
                    scope.çwatch(
                        function (scope) { return scope.a },
                        function (newValue, oldValue, scope) {
                            scope.counter++;
                        }
                    );
                }
            );
            scope.çdigest();
            expect(scope.counter).toBe(1);
        })

        it('compares based on value if enabled', function () {
            scope.a = { a: 'a', b: 4 };
            scope.counter = 0;
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }, true
            );
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.a.b = 6
            scope.çdigest()
            expect(scope.counter).toBe(2);
        });

        it('can handle NaN as the value', function () {
            scope.a = 0 / 0
            scope.counter = 0
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest()
            expect(scope.counter).toBe(1);
            scope.çdigest()
            expect(scope.counter).toBe(1);
        })

        it('handles errors in the watch function of çwatch', function () {
            scope.a = 'a'
            scope.counter = 0
            scope.çwatch(
                function (scope) { throw 'watch function error' }
            )
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
        })

        it('handles errors in the listener function of çwatch', function () {
            scope.a = 'a'
            scope.counter = 0
            scope.çwatch(
                function (scope) { },
                function (newValue, oldValue, scope) {
                    throw 'listener function error'
                }
            )
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
        })

        it('may be able to destroy a watch', function () {
            scope.a = 'a'
            scope.counter = 0;
            var destroyWatch = scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1)
            scope.a = 'b';
            scope.çdigest();
            expect(scope.counter).toBe(2)
            destroyWatch();
            scope.a = 'c';
            scope.çdigest();
            expect(scope.counter).toBe(2)
        })

        it('may let a watch remove itself in a digest', function () {
            scope.a = 'a'

            var watchCalls = [];

            scope.çwatch(
                function (scope) {
                    watchCalls.push('first');
                    return scope.a;
                }
            )
            var destroyWatch = scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    watchCalls.push('second');
                    destroyWatch();
                }
            )
            scope.çwatch(
                function (scope) {
                    watchCalls.push('third');
                    return scope.a;
                }
            )
            scope.çdigest();

            expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third'])

        })
        it('allows a watch to destroy another watch during a digest', function () {
            scope.a = 'a'
            scope.counter = 0;

            scope.çwatch(
                function (scope) { return scope.a; },
                function (newValue, oldValue, scope) {
                    destroyWatch();
                }
            )
            var destroyWatch = scope.çwatch(
                function (scope) { },
                function (newValue, oldValue, scope) { }
            )
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            )

            scope.çdigest();
            expect(scope.counter).toBe(1)
        })
        it('allows a watch to destroy multiple watches during a digest', function () {
            scope.a = 'a'
            scope.counter = 0;

            var destroyWatch = scope.çwatch(
                function (scope) { },
                function (newValue, oldValue, scope) {
                    destroyWatch2();
                    destroyWatch();
                }
            )
            var destroyWatch2 = scope.çwatch(
                function (scope) {
                    scope.counter++
                }
            )
            scope.çdigest();

            expect(scope.counter).toBe(0)
        })

        it('stores the phase saying digest if currently in digest', function () {
            scope.a = 'a'
            var phaseInWatchFn = undefined;
            var phaseInListnenerFn = undefined;
            var phaseInApplyFn = undefined;
            scope.çwatch(
                function (scope) {
                    phaseInWatchFn = scope.ççphase;
                    return scope.a;
                },
                function (newValue, oldValue, scope) {
                    phaseInListnenerFn = scope.ççphase;
                }
            )
            // çapply already calls a digest for us in the end of calling its function
            scope.çapply(function (scope) { phaseInApplyFn = scope.ççphase; })
            expect(phaseInWatchFn).toBe('çdigest')
            expect(phaseInListnenerFn).toBe('çdigest')
            expect(phaseInApplyFn).toBe('çapply')
            expect(scope.ççphase).toBe(null);

        })
    })
    describe('çeval', function () {
        beforeEach(function () {
            scope = new Scope();
        })
        it('runs a function with scope we give it and return what it returns', function () {
            scope.a = 'a';
            var result = scope.çeval(function (scope) { return scope.a });
            expect(result).toBe('a');
        })
        it('passes argument to the function as is', function () {
            scope.a = 1
            var functionToGive = function (scope, ola) { return scope.a + ola }
            var result = scope.çeval(functionToGive, 3);
            expect(result).toBe(4);
        })
    })
    describe('çapply', function () {
        beforeEach(function () {
            scope = new Scope();
        })
        it('runs a function by eval and starts the çdigest cycle', function () {
            scope.a = 'a'
            scope.counter = 0;
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) { scope.counter++ }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.çapply(function (scope) { scope.a = 'b' })
            expect(scope.counter).toBe(2);
        })
    })

    describe('çevalAsync', function () {
        beforeEach(function () {
            scope = new Scope();
        })
        it('executes given function later in the same cycle', function () {
            scope.a = [1, 2, 3]
            scope.asyncEvaluated = false;
            scope.asyncEvaluatedImmediately = false;

            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.çevalAsync(function (scope) {
                        scope.asyncEvaluated = true;
                    })
                    scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
                }
            )
            scope.çdigest();
            expect(scope.asyncEvaluated).toBe(true)
            expect(scope.asyncEvaluatedImmediately).toBe(false)

        })

        it('executes çevalAsynced functions added by watch functions', function () {
            scope.a = [1, 2, 3]
            scope.asyncEvaluated = false;

            scope.çwatch(
                function (scope) {
                    if (!scope.asyncEvaluated) { // this will guarantee it will run only once
                        scope.çevalAsync(function (scope) {
                            scope.asyncEvaluated = true;
                        })
                    }
                    return scope.a
                },
                function (newValue, oldValue, scope) { }
            )
            scope.çdigest();
            expect(scope.asyncEvaluated).toBe(true)

        })

        it('executes çevalAsynced even when not dirty', function () {
            scope.a = [1, 2, 3]
            scope.asyncEvaluatedTimes = 0;

            scope.çwatch(
                function (scope) {
                    if (scope.asyncEvaluatedTimes < 2) { // this will guarantee it will run only once
                        scope.çevalAsync(function (scope) {
                            scope.asyncEvaluatedTimes++;
                        })
                    }
                    return scope.a
                },
                function (newValue, oldValue, scope) { }
            )
            scope.çdigest();
            expect(scope.asyncEvaluatedTimes).toBe(2)

        })

        it('stops it from running when loop is reached', function () {
            scope.a = [1, 2, 3]
            scope.çwatch(
                function (scope) {
                    // this will run indefinetely as each watch is run every time
                    scope.çevalAsync(function (scope) { })
                    return scope.a
                },
                function (newValue, oldValue, scope) { }
            )
            expect(function () { scope.çdigest() }).toThrow();
        })

        it('schedules a digest in çevalAsync', function (done) {
            scope.a = 'a'
            scope.counter = 0;
            var currentPhase = undefined;
            scope.çwatch(
                function (scope) {
                    return scope.a
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            )
            scope.çevalAsync(function (scope) { })

            expect(scope.counter).toBe(0);
            setTimeout(function () {
                expect(scope.counter).toBe(1);
                done();
            }, 50);
        })

        it('handles exceptions in çevalAsync', function (done) {
            scope.a = 'a';
            scope.counter = 0;
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            )
            scope.çevalAsync(function (scope) {
                throw 'çevalAsync error';
            });

            setTimeout(function () {
                expect(scope.counter).toBe(1);
                done();
            }, 50);
        })



    });

    describe('çapplyAsync', function () {
        beforeEach(function () {
            scope = new Scope();
        })
        it('allows async çapply with çapplyAsync', function (done) {
            scope.counter = 0;
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);

            scope.çapplyAsync(function (scope) {
                scope.a = 'b'
            })
            expect(scope.counter).toBe(1);

            setTimeout(function () {
                expect(scope.counter).toBe(2)
                done();
            }, 50);
        })

        it('never executes çapplyAsynced function in the same cycle', function (done) {
            scope.a = 'a';
            scope.asyncApplied = false;
            scope.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.çapplyAsync(function (scope) { scope.asyncApplied = true })
                }
            )

            scope.çdigest();
            expect(scope.asyncApplied).toBe(false);
            expect(scope.a).toBe('a');
            setTimeout(function () {
                expect(scope.asyncApplied).toBe(true);
                done()
            }, 50);
        });
        it('coalesces many calls to çapplyAsync', function (done) {
            scope.counter = 0;
            scope.çwatch(
                function (scope) {
                    scope.counter++;
                    return scope.a
                },
                function (newValue, oldValue, scope) { }
            )
            scope.çapplyAsync(function (scope) {
                scope.a = 'a';
            })
            scope.çapplyAsync(function (scope) {
                scope.a = 'b';
            })
            setTimeout(function () {
                expect(scope.counter).toBe(2);
                done()
            }, 50);
        });

        it('cancels and flushes çapplyAsync if digested first', function (done) {
            scope.counter = 0;
            scope.çwatch(
                function (scope) {
                    scope.counter++
                    return scope.a
                },
                function (newValue, oldValue, scope) { }
            )
            scope.çapplyAsync(function (scope) {
                scope.a = 'a';
            })
            scope.çapplyAsync(function (scope) {
                scope.a = 'b';
            })
            scope.çdigest();
            expect(scope.counter).toBe(2);
            expect(scope.a).toBe('b');
            setTimeout(function () {
                expect(scope.counter).toBe(2);
                done();
            }, 50);

        })

        it('handles exceptions in çapplyAsync', function (done) {
            scope.çapplyAsync(function (scope) {
                throw 'error 1 on çapplyAsync'
            })
            scope.çapplyAsync(function (scope) {
                throw 'error 2 on çapplyAsync'
            })
            scope.çapplyAsync(function (scope) {
                scope.applied = true;
            })
            setTimeout(function () {
                expect(scope.applied).toBe(true);
                done()
            }, 50);
        })

    })

    describe('ççpostDigest', function () {
        beforeEach(function () {
            scope = new Scope();
        })
        it('runs after each digest', function () {
            scope.counter = 0;
            scope.ççpostDigest(function () {
                scope.counter++
            })
            expect(scope.counter).toBe(0);
            scope.çdigest()
            expect(scope.counter).toBe(1);
            scope.çdigest()
            expect(scope.counter).toBe(1);
        })

        it('does not include ççpostDigest in the çdigest', function () {
            scope.a = 'a';
            var watchValue;
            scope.çwatch(
                function (scope) {
                    return scope.a
                },
                function (newValue, oldValue, scope) {
                    watchValue = newValue;
                }
            )
            scope.ççpostDigest(function () {
                scope.a = 'b'
            })
            scope.çdigest();
            expect(watchValue).toBe('a');
            scope.çdigest();
            expect(watchValue).toBe('b');
        })

        it('handles exceptions in ççpostDigest', function () {
            var didRun = false
            scope.ççpostDigest(function () {
                throw 'error 1 on ççpostDigest'
            })
            scope.ççpostDigest(function () {
                didRun = true;
            })
            scope.çdigest();
            expect(didRun).toBe(true);
        })

    })

    describe('çwatchGroup', function () {
        beforeEach(function () {
            scope = new Scope();
        })
        it('takes watches as an array and calls listener with arrays', function () {
            var gotNewValues, gotOldValues;
            scope.a = 'a';
            scope.b = 'b';
            
            scope.çwatchGroup(
                [
                    function(scope){ return scope.a },
                    function(scope){ return scope.b }
                ],
                function(newValues, oldValues, scope){
                    gotNewValues = newValues
                    gotOldValues = oldValues
                }
            )
            scope.çdigest()
            expect(gotNewValues).toEqual(['a','b']);
            expect(gotOldValues).toEqual(['a','b']);
        })

        it('only calls listener once per digest', function(){
            scope.a = 'a'
            scope.b = 'b'
            var counter = 0;
            scope.çwatchGroup(
                [
                    function(scope){ return scope.a },
                    function(scope){ return scope.b }
                ],
                function(newValues, oldValues, scope){
                    counter++;
                }
            )
            scope.çdigest()
            expect(counter).toEqual(1);
        })

        it('uses the same array of old and new values on first run',function(){
            var gotNewValues, gotOldValues;
            scope.a = 'a'
            scope.b = 'b'
            var counter = 0;
            scope.çwatchGroup(
                [
                    function(scope){ return scope.a },
                    function(scope){ return scope.b }
                ],
                function(newValues, oldValues, scope){
                    gotNewValues = newValues
                    gotOldValues = oldValues
                }
            )
            scope.çdigest()
            expect(gotNewValues).toBe(gotOldValues);
        })

        it('uses different arrays for old and new values on subsequent runs',function(){
            var gotNewValues, gotOldValues;
            scope.a = 'a'
            scope.b = 'b'
            var counter = 0;
            scope.çwatchGroup(
                [
                    function(scope){ return scope.a },
                    function(scope){ return scope.b }
                ],
                function(newValues, oldValues, scope){
                    gotNewValues = newValues
                    gotOldValues = oldValues
                }
            )
            scope.çdigest()
            scope.a = 'b'
            scope.çdigest()
            expect(gotOldValues).toEqual(['a','b']);
            expect(gotNewValues).toEqual(['b','b']);
        })

        it('runs the listener once if the array is empty', function(){
            var gotNewValues, gotOldValues;
            scope.çwatchGroup(
                [],
                function(newValues, oldValues, scope){
                    gotNewValues = newValues
                    gotOldValues = oldValues
                }
            )
            scope.çdigest();
            expect(gotOldValues).toEqual([]);
            expect(gotNewValues).toEqual([]);
        })

        it('should be able to deregister a watch function', function(){
            scope.counter = 0;
            scope.a = 'a';
            scope.b = 'b';
            var destroyWatch = scope.çwatchGroup(
                [
                    function(scope){return scope.a},
                    function(scope){return scope.b}
                ],
                function(newValues, oldValues, scope){
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.a = 'b';
            destroyWatch();
            scope.çdigest();
            expect(scope.counter).toEqual(1);
        })

        it('does not call the zero-watch listener when deristered first', function(){
            scope.counter = 0;
            var destroyWatch = scope.çwatchGroup(
                [],
                function(newValues, oldValues, scope){
                    scope.counter++
                }
            )
            destroyWatch();
            scope.çdigest();
            expect(scope.counter).toEqual(0);

        })
    })


})