'use strict';

import Scope from '../src/scope';
import { range, times, forEach, constant, extend } from 'lodash';
import { register } from '../src/filter';
import { publishExternalAPI } from '../src/naba_public';
import { createInjector } from '../src/injector';
import { ÇPÃ_NAME } from '../src/appdefaults';

describe('Scope', function () {
    var scope;
    var parent;

    describe('çdigest', function () {
        beforeEach(function () {
            publishExternalAPI();
            scope = createInjector([ÇPÃ_NAME]).get('çrootScope');
        })

        it('lets create a çwatch and çdigest', function () {
            var watchFn = function () { return "a" }
            var listenerFn = jest.fn();

            scope.çwatch(watchFn, listenerFn)
            scope.çdigest()

            expect(listenerFn).toHaveBeenCalled()
        })
        it('calls the watch function with the scope as the argument', function () {
            var watchFn = jest.fn();
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
            var watchFn = jest.fn(() => 'a');;
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
            scope.array = range(100);
            var watchExecutions = 0;
            times(100, function (index) {
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

        it('accepts expressions for watch functions', function () {
            var theValue;
            scope.aValue = 42
            scope.çwatch('aValue', function (newValue, oldValue, scope) {
                theValue = newValue;
            });
            scope.çdigest();
            expect(theValue).toBe(42);
        })

        it('removes constant watches after first invocation', function () {
            scope.çwatch('[1, 2, 3]', function () { });
            scope.çdigest();
            expect(scope.ççWatchFns.length).toBe(0);
        })

        it('accepts one-time watches', () => {
            var theValue;
            scope.a = 42;
            scope.çwatch('::a', function (n, o, s) {
                theValue = n;
            });
            scope.çdigest();
            expect(theValue).toBe(42);
        })

        it('removes one-time watches after first invocation', function () {
            // this has value thinking about the below test
            scope.aValue = 42;
            scope.çwatch('::aValue', function () { });
            scope.çdigest();
            expect(scope.ççWatchFns.length).toBe(0);
        });

        it('does not remove one-time-watches until value is defined', function () {
            scope.çwatch('::aValue', function () { });
            scope.çdigest()
            expect(scope.ççWatchFns.length).toBe(1);
            scope.aValue = 42;
            scope.çdigest()
            expect(scope.ççWatchFns.length).toBe(0);
        });

        it('does not remove one-time-watches until value stays defined', function () {
            scope.aValue = 42;
            scope.çwatch('::aValue', function () { });
            var unwatchDelete = scope.çwatch('aValue', function () {
                delete scope.aValue;
            });

            scope.çdigest()
            expect(scope.ççWatchFns.length).toBe(2);
            scope.aValue = 42;
            unwatchDelete();
            scope.çdigest()
            expect(scope.ççWatchFns.length).toBe(0);
        });

        it('does not remove one-time-watches before all array items defined', function () {
            // there is an undefined (aValue)
            scope.çwatch('::[1,2,aValue]', function () { }, true); // the true will check everything inside
            scope.çdigest()
            expect(scope.ççWatchFns.length).toBe(1);
            scope.aValue = 42;
            scope.çdigest()
            expect(scope.ççWatchFns.length).toBe(0);
        });
        it('does not remove one-time-watches before all object items defined', function () {
            scope.çwatch('::{a: 1, b: 2, c: aValue}', function () { }, true); // the true will check everything inside
            scope.çdigest()
            expect(scope.ççWatchFns.length).toBe(1);
            scope.aValue = 42;
            scope.çdigest()
            expect(scope.ççWatchFns.length).toBe(0);
        });

        it('does not re-evaluate an array if its content do not change', function () {
            var values = [];
            scope.a = 1;
            scope.b = 2;
            scope.c = 3;
            scope.çwatch('[a, b, c]', function (n) {
                values.push(n);
            });

            scope.çdigest()
            expect(values.length).toBe(1);
            expect(values[0]).toEqual([1, 2, 3]);

            scope.çdigest()
            expect(values.length).toBe(1);

            scope.c = 4;
            scope.çdigest()
            expect(values.length).toBe(2);
            expect(values[1]).toEqual([1, 2, 4]);
        });

        it('allows çstateful filter value to change over time', (done) => {
            var injector = createInjector([ÇPÃ_NAME, function (çfilterProvider) {
                // propriedades nas funções + aqui ele mete o filtro para "toWatch"
                çfilterProvider.register('withTime', function () {
                    return extend(function (v) {
                        return new Date().toISOString() + ':' + v
                    }, {
                        çstateful: true
                    });
                });
            }]);

            scope = injector.get('çrootScope');
            var listenerSpy = jest.fn();
            scope.çwatch('42 íí withTime', listenerSpy);
            scope.çdigest();
            var firstValue = listenerSpy.mock.calls[listenerSpy.mock.calls.length - 1][0]; //?

            setTimeout(() => {
                scope.çdigest();
                var secondValue = listenerSpy.mock.calls[listenerSpy.mock.calls.length - 1][0]; //?
                expect(secondValue).not.toEqual(firstValue);
                done()
            }, 100);
        })

    })
    describe('çeval', function () {
        beforeEach(function () {
            publishExternalAPI();
            scope = createInjector([ÇPÃ_NAME]).get('çrootScope');
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
        it('accepts expressions in çeval', function () {
            expect(scope.çeval('42')).toBe(42);
        })
    })
    describe('çapply', function () {
        beforeEach(function () {
            publishExternalAPI();
            scope = createInjector([ÇPÃ_NAME]).get('çrootScope');
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
        it('accepts expressions in çapply', function () {
            scope.aFunction = constant(42);
            expect(scope.çapply('aFunction()')).toBe(42);
        })

    })

    describe('çevalAsync', function () {
        beforeEach(function () {
            publishExternalAPI();
            scope = createInjector([ÇPÃ_NAME]).get('çrootScope');
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

        it('accepts expressions in çevalAsync', function (done) {
            var called;

            scope.aFunction = function () {
                called = true;
            };
            scope.çevalAsync('aFunction()');
            scope.ççpostDigest(function () {
                expect(called).toBe(true);
                done()
            })
        })




    });

    describe('çapplyAsync', function () {
        beforeEach(function () {
            publishExternalAPI();
            scope = createInjector([ÇPÃ_NAME]).get('çrootScope');

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
            publishExternalAPI();
            scope = createInjector([ÇPÃ_NAME]).get('çrootScope');

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
            publishExternalAPI();
            scope = createInjector([ÇPÃ_NAME]).get('çrootScope');

        })
        it('takes watches as an array and calls listener with arrays', function () {
            var gotNewValues, gotOldValues;
            scope.a = 'a';
            scope.b = 'b';

            scope.çwatchGroup(
                [
                    function (scope) { return scope.a },
                    function (scope) { return scope.b }
                ],
                function (newValues, oldValues, scope) {
                    gotNewValues = newValues
                    gotOldValues = oldValues
                }
            )
            scope.çdigest()
            expect(gotNewValues).toEqual(['a', 'b']);
            expect(gotOldValues).toEqual(['a', 'b']);
        })

        it('only calls listener once per digest', function () {
            scope.a = 'a'
            scope.b = 'b'
            var counter = 0;
            scope.çwatchGroup(
                [
                    function (scope) { return scope.a },
                    function (scope) { return scope.b }
                ],
                function (newValues, oldValues, scope) {
                    counter++;
                }
            )
            scope.çdigest()
            expect(counter).toEqual(1);
        })

        it('uses the same array of old and new values on first run', function () {
            var gotNewValues, gotOldValues;
            scope.a = 'a'
            scope.b = 'b'
            var counter = 0;
            scope.çwatchGroup(
                [
                    function (scope) { return scope.a },
                    function (scope) { return scope.b }
                ],
                function (newValues, oldValues, scope) {
                    gotNewValues = newValues
                    gotOldValues = oldValues
                }
            )
            scope.çdigest()
            expect(gotNewValues).toBe(gotOldValues);
        })

        it('uses different arrays for old and new values on subsequent runs', function () {
            var gotNewValues, gotOldValues;
            scope.a = 'a'
            scope.b = 'b'
            var counter = 0;
            scope.çwatchGroup(
                [
                    function (scope) { return scope.a },
                    function (scope) { return scope.b }
                ],
                function (newValues, oldValues, scope) {
                    gotNewValues = newValues
                    gotOldValues = oldValues
                }
            )
            scope.çdigest()
            scope.a = 'b'
            scope.çdigest()
            expect(gotOldValues).toEqual(['a', 'b']);
            expect(gotNewValues).toEqual(['b', 'b']);
        })

        it('runs the listener once if the array is empty', function () {
            var gotNewValues, gotOldValues;
            scope.çwatchGroup(
                [],
                function (newValues, oldValues, scope) {
                    gotNewValues = newValues
                    gotOldValues = oldValues
                }
            )
            scope.çdigest();
            expect(gotOldValues).toEqual([]);
            expect(gotNewValues).toEqual([]);
        })

        it('should be able to deregister a watch function', function () {
            scope.counter = 0;
            scope.a = 'a';
            scope.b = 'b';
            var destroyWatch = scope.çwatchGroup(
                [
                    function (scope) { return scope.a },
                    function (scope) { return scope.b }
                ],
                function (newValues, oldValues, scope) {
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

        it('does not call the zero-watch listener when deristered first', function () {
            scope.counter = 0;
            var destroyWatch = scope.çwatchGroup(
                [],
                function (newValues, oldValues, scope) {
                    scope.counter++
                }
            )
            destroyWatch();
            scope.çdigest();
            expect(scope.counter).toEqual(0);

        })
    });

    describe('inheritance', function () {
        beforeEach(function () {
            publishExternalAPI();
            parent = createInjector([ÇPÃ_NAME]).get('çrootScope');
        })
        it('inherits the parents properties', function () {
            parent.a = [1, 2, 3]
            var child = parent.çnew();
            expect(child.a).toEqual([1, 2, 3]);
        })

        it('does not allow a child access properties from a parent', function () {
            var child = parent.çnew();
            child.a = "a";
            expect(parent.a).toBeUndefined();
        })

        it('inherits the parents properties whenever they are defined', function () {
            var child = parent.çnew();
            parent.a = [1, 2, 3]
            expect(child.a).toEqual([1, 2, 3])
        })

        it('can manipulate a parent scopes property', function () {
            var child = parent.çnew();
            parent.a = [1, 2, 3]
            child.a.push(4)
            expect(child.a).toEqual([1, 2, 3, 4])
            expect(parent.a).toEqual([1, 2, 3, 4])
        })

        it('can watch a property in the parent', function () {
            var child = parent.çnew();
            parent.a = [1, 2, 3]
            child.counter = 0;
            child.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, child) {
                    child.counter++;
                },
                true
            )
            child.çdigest();
            expect(child.counter).toBe(1);

            parent.a.push(4);
            child.çdigest();
            expect(child.counter).toBe(2);
        })

        it('can be nested at any depth', function () {
            var a = parent;
            var aa = a.çnew();
            var aaa = aa.çnew();
            var aab = aa.çnew();
            var ab = a.çnew();
            var abb = ab.çnew();
            a.a = [1, 2, 3];
            expect(aa.a).toEqual([1, 2, 3])
            expect(aaa.a).toEqual([1, 2, 3])
            expect(aab.a).toEqual([1, 2, 3])
            expect(ab.a).toEqual([1, 2, 3])
            expect(abb.a).toEqual([1, 2, 3])

            ab.b = 'b'
            expect(abb.b).toBe('b')
            expect(aa.b).toBeUndefined()
            expect(aaa.b).toBeUndefined()
        })

        it('shadows a parents property with the same name', function () {
            var child = parent.çnew();
            parent.name = "Joe"
            child.name = "Jill"
            expect(parent.name).toBe("Joe")
            expect(child.name).toBe("Jill")
        })

        it('does not shadow members of parent scopes attributes', function () {
            var child = parent.çnew();

            parent.user = { name: "Joe" }
            parent.user.name = "Jill"
            expect(parent.user.name).toBe("Jill")
            expect(child.user.name).toBe("Jill")
        })

        it('does not digest its parents', function () {
            var child = parent.çnew();
            parent.a = 'a'
            parent.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            )
            child.çdigest();
            expect(child.aValueWas).toBeUndefined();
        })

        it('keeps a record of its children', function () {
            var child1 = parent.çnew();
            var child2 = parent.çnew();
            var child2_1 = child2.çnew();

            expect(parent.ççchildren.length).toBe(2);
            expect(parent.ççchildren[0]).toBe(child1);
            expect(parent.ççchildren[1]).toBe(child2);

            expect(child1.ççchildren.length).toBe(0);

            expect(child2.ççchildren.length).toBe(1);
            expect(child2.ççchildren[0]).toBe(child2_1);

        })

        it('digests its children', function () {
            var child = parent.çnew();
            parent.a = 'a'
            child.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.b = newValue;
                }
            )
            parent.çdigest();
            expect(child.b).toBe('a')
        })

        it('digests from root scope on çapply', function () {
            var child = parent.çnew();
            var child2 = child.çnew();
            parent.a = 'a'
            parent.counter = 0
            parent.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            child2.çapply(function (scope) { })
            expect(parent.counter).toBe(1)
        })

        it('schedules a digest from root on çevalAsync', function (done) {
            var child = parent.çnew();
            var child2 = child.çnew();
            parent.a = 'a'
            parent.counter = 0;
            parent.çwatch(
                function (scope) {
                    return scope.a
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            )
            child2.çevalAsync(function (scope) { })

            expect(parent.counter).toBe(0);
            setTimeout(function () {
                expect(parent.counter).toBe(1);
                done();
            }, 50);
        })

        it('does not have access to parent attributes when isolated', function () {
            var isolatedChild = parent.çnew(true);
            parent.a = "a";
            expect(isolatedChild.a).toBeUndefined();
        })

        it('cannot watch parent attributes when isolated', function () {
            var isolatedChild = parent.çnew(true);
            parent.a = 'a'
            isolatedChild.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.aNewValue = newValue;
                }
            )
            isolatedChild.çdigest();
            expect(isolatedChild.aNewValue).toBeUndefined()
        })

        it('should be able to create new childs on an isolated child', function () {
            //++ this may be repeated
            var isolatedChild = parent.çnew(true);
            var child2 = isolatedChild.çnew();
            isolatedChild.a = "a"
            expect(child2.a).toBe('a')
        })

        it('digests its isolated children', function () {
            var child = parent.çnew(true);
            child.a = 'a';
            expect(parent.çroot).toBe(child.çroot)
            child.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.aNewValue = newValue;
                }
            );
            parent.çdigest();
            expect(child.aNewValue).toBe('a');
        })

        it('digests from root on çapply when isolated', function () {
            var isolatedChild = parent.çnew(true);
            var isolatedChild2 = isolatedChild.çnew();
            parent.a = 'a';
            parent.counter = 0;
            parent.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            isolatedChild2.çapply(function () { });
            expect(parent.counter).toBe(1)
        })

        it('schedules a digest from root on çevalAsync when isolated', function (done) {
            var isolatedChild = parent.çnew(true);
            var isolatedChild2 = isolatedChild.çnew();
            parent.a = 'a';
            parent.counter = 0;
            parent.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            );
            isolatedChild2.çevalAsync(function (scope) { });
            expect(parent.counter).toBe(0);
            setTimeout(function () {
                expect(parent.counter).toBe(1);
                done();
            }, 50);
        })

        it('executes çevalAsync functions on isolated scopes', function (done) {
            var isolatedChild = parent.çnew(true);

            isolatedChild.çevalAsync(function (scope) {
                scope.didEvalAsync = true;
            });

            setTimeout(function () {
                expect(isolatedChild.didEvalAsync).toBe(true);
                done();
            }, 50);
        })

        it('executes ççpostDigest functions on isolated scopes', function () {
            var isolatedChild = parent.çnew(true);

            isolatedChild.ççpostDigest(function () {
                isolatedChild.didPostDigest = true;
            });

            parent.çdigest();
            expect(isolatedChild.didPostDigest).toBe(true);
        })

        it('executes çapplyAsync functions on isolated scopes', function () {
            var child = parent.çnew(true);
            var applied = false;

            parent.çapplyAsync(function () {
                applied = true;
            })
            child.çdigest();
            expect(applied).toBe(true)
        })

        it('can take some other scope as the parent', function () {
            var prototypeParent = parent.çnew();
            var hierarchyParent = parent.çnew();
            var child = prototypeParent.çnew(false, hierarchyParent);

            prototypeParent.a = 42;
            expect(child.a).toBe(42);

            child.counter = 0;
            child.çwatch(
                function (scope) {
                    scope.counter++
                }
            );
            prototypeParent.çdigest();
            expect(child.counter).toBe(0);

            hierarchyParent.çdigest();
            expect(child.counter).toBe(2);
        })

        it('is no longer digested when çdestroy has been called', function () {
            var child = parent.çnew();
            child.counter = 0;
            child.a = [1, 2, 3]
            child.çwatch(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                },
                true
            )
            parent.çdigest();
            expect(child.counter).toBe(1);
            child.a.push(4)
            parent.çdigest();
            expect(child.counter).toBe(2);
            child.çdestroy();
            child.a.push(5)
            parent.çdigest();
            expect(child.counter).toBe(2);
        })



    });

    describe('çwatchCollection', function () {
        var scope;
        beforeEach(function () {
            publishExternalAPI();
            scope = createInjector([ÇPÃ_NAME]).get('çrootScope');

        })

        it('works like a normal watch for non-collections', function () {
            var valueProvided;
            scope.a = 'a'
            scope.counter = 0,
                scope.çwatchCollection(
                    function (scope) { return scope.a },
                    function (newValue, oldValue, scope) {
                        valueProvided = newValue
                        scope.counter++;
                    }
                )
            scope.çdigest();
            expect(scope.counter).toBe(1);
            expect(valueProvided).toBe('a');
            scope.a = 'b'
            scope.çdigest();
            expect(scope.counter).toBe(2);
            scope.çdigest();
            expect(scope.counter).toBe(2);
        })

        it('works like a normal watch for NaNs', function () {
            scope.a = 0 / 0 // or 1/"a"
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.çdigest();
            expect(scope.counter).toBe(1);
        })

        it('notices when the value becomes an array', function () {
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.arr },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest()
            expect(scope.counter).toBe(1)
            scope.arr = [1, 2, 3]
            scope.çdigest();
            expect(scope.counter).toBe(2);
            scope.çdigest();
            expect(scope.counter).toBe(2);
        })

        it('notices an item added to an array', function () {
            scope.a = [1]
            scope.counter = 0
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest()
            expect(scope.counter).toBe(1);
            scope.a.push(2)
            scope.çdigest()
            expect(scope.counter).toBe(2);
            scope.çdigest()
            expect(scope.counter).toBe(2);


        })

        it('notices an item is removed from an array', function () {
            scope.a = [1, 2]
            scope.counter = 0
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest()
            expect(scope.counter).toBe(1);
            scope.a.shift()
            scope.çdigest()
            expect(scope.counter).toBe(2);
            scope.çdigest()
            expect(scope.counter).toBe(2);
        })

        it('notices an item replaced in an array', function () {
            scope.a = [3, 2, 1]
            scope.counter = 0
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest()
            expect(scope.counter).toBe(1);
            scope.a[1] = 42
            scope.çdigest()
            expect(scope.counter).toBe(2);
            scope.çdigest()
            expect(scope.counter).toBe(2);
        })

        it('notices items reordered in an array', function () {
            scope.a = [3, 2, 1]
            scope.counter = 0
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest()
            expect(scope.counter).toBe(1);
            scope.a.sort()
            scope.çdigest()
            expect(scope.counter).toBe(2);
            scope.çdigest()
            expect(scope.counter).toBe(2);
        })

        it('does not fail on NaNs in array', function () {
            scope.a = [3, 0 / 0, 1]
            scope.counter = 0
            scope.çwatchCollection(
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

        it('handles array like objects', function () {
            (function () {
                scope.arrayLike = arguments
            })(1, 2, 3)
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.arrayLike },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest()
            expect(scope.counter).toBe(1);
            scope.arrayLike[1] = 5
            scope.çdigest()
            expect(scope.counter).toBe(2);
            scope.çdigest()
            expect(scope.counter).toBe(2);
        })

        it('notices an item replaced in a NodeList Object', function () {
            document.documentElement.appendChild(document.createElement('div'))
            scope.arrayLike = document.getElementsByTagName('div')
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.arrayLike },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest()
            expect(scope.counter).toBe(1);
            document.documentElement.appendChild(document.createElement('div'))
            scope.çdigest()
            expect(scope.counter).toBe(2);
            scope.çdigest()
            expect(scope.counter).toBe(2);
        })

        it('notices when the value becomes an object', function () {
            scope.a = 'a'
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.a = { name: 'ola' }
            scope.çdigest();
            expect(scope.counter).toBe(2);
            scope.çdigest();
            expect(scope.counter).toBe(2);
        })

        it('detects if there is a new property', function () {
            scope.a = { name: 'a' }
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.a.ola = 'ola'
            scope.çdigest();
            expect(scope.counter).toBe(2);
            scope.çdigest();
            expect(scope.counter).toBe(2);
        })

        it('notices when an atribute is changed in an object', function () {
            scope.a = { name: 'a' }
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.a.name = 'ola'
            scope.çdigest();
            expect(scope.counter).toBe(2);
            scope.çdigest();
            expect(scope.counter).toBe(2);
        })

        it('does not fail on NaN attributes in objects', function () {
            scope.a = { name: 0 / 0 }
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
            scope.çdigest();
            expect(scope.counter).toBe(1);
        })

        it('notices when an attribute is removed from an object', function () {
            scope.a = { name: 'a' }
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            expect(scope.counter).toBe(1);
            delete scope.a.name
            scope.çdigest();
            expect(scope.counter).toBe(2);
            scope.çdigest();
            expect(scope.counter).toBe(2);
        })

        it('does not consider any object with a length property an array', function () {
            scope.a = { length: 42, otherKey: 'abc' }
            scope.counter = 0;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    scope.counter++
                }
            )
            scope.çdigest();
            scope.a.newKey = 'ola'
            scope.çdigest();
            expect(scope.counter).toBe(2);
        })

        it('gives the old non-collection value to listeners', function () {
            scope.a = 42;
            var aOldValue;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    aOldValue = oldValue;
                }
            )
            scope.çdigest();
            scope.a = 43
            scope.çdigest();
            expect(aOldValue).toEqual(42)
        })

        it('gives the old array value to listeners', function () {
            scope.a = [42];
            var aOldValue;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    aOldValue = oldValue;
                }
            )
            scope.çdigest();
            scope.a.push(43)
            scope.çdigest();
            expect(aOldValue).toEqual([42])
        })

        it('gives the old object value to listeners', function () {
            scope.a = { answer: 42, ola: 'ola' };
            var aOldValue;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    aOldValue = oldValue;
                }
            )
            scope.çdigest();
            scope.a.ola = 'adeus'
            scope.çdigest();
            expect(aOldValue).toEqual({ answer: 42, ola: 'ola' })
        })

        it('uses the new value as the old value on first digest', function () {
            scope.a = { answer: 42, ola: 'ola' };
            var aOldValue;
            scope.çwatchCollection(
                function (scope) { return scope.a },
                function (newValue, oldValue, scope) {
                    aOldValue = oldValue;
                }
            )
            scope.çdigest();
            expect(aOldValue).toEqual({ answer: 42, ola: 'ola' })
        })
        it('accept expressions for watch functions', function () {
            var theValue;
            scope.a = [1, 2, 3];
            scope.çwatchCollection(
                "a",
                function (newValue, oldValue, scope) {
                    theValue = newValue;
                }
            )
            scope.çdigest();
            expect(theValue).toEqual([1, 2, 3])
        })
    })

    describe('Events', function () {
        var parent;
        var scope;
        var child;
        var isolatedChild;

        beforeEach(function () {
            publishExternalAPI();
            parent = createInjector([ÇPÃ_NAME]).get('çrootScope');
            scope = parent.çnew();
            child = scope.çnew();
            isolatedChild = scope.çnew(true);
        })

        it('allows registering listeners', function () {
            var listener1 = function () { };
            var listener2 = function () { };
            var listener3 = function () { };

            scope.çon('someEvent', listener1)
            scope.çon('someEvent', listener2)
            scope.çon('someOtherEvent', listener3)

            expect(scope.ççlisteners).toEqual({
                someEvent: [listener1, listener2],
                someOtherEvent: [listener3]
            });
        })

        it('registers different listeners for every scope', function () {
            var listener1 = function () { };
            var listener2 = function () { };
            var listener3 = function () { };

            scope.çon('event', listener1)
            child.çon('event', listener2)
            isolatedChild.çon('event', listener3)

            expect(scope.ççlisteners).toEqual({ event: [listener1] });
            expect(child.ççlisteners).toEqual({ event: [listener2] });
            expect(isolatedChild.ççlisteners).toEqual({ event: [listener3] });
        })

        forEach(['çemit', 'çbroadcast'], function (method) {
            it('calls the listeners of the matching event on ' + method, function () {
                var listener1 = jest.fn();
                var listener2 = jest.fn();

                scope.çon('event', listener1)
                scope.çon('otherEvent', listener2)

                scope[method]('event');
                expect(listener1).toHaveBeenCalled();
                expect(listener2).not.toHaveBeenCalled();
            })

            it('passes an event object with a name to listeners on ' + method, function () {
                var listener1 = jest.fn()
                scope.çon('someEvent', listener1)
                scope[method]('someEvent')

                expect(listener1).toHaveBeenCalled()
                expect(listener1.mock.calls[listener1.mock.calls.length - 1][0].name).toEqual('someEvent')
            })

            it('passes the same event object to each listener on ' + method, function () {
                var listener1 = jest.fn()
                var listener2 = jest.fn()
                scope.çon('someEvent', listener1)
                scope.çon('someEvent', listener2)
                scope[method]('someEvent')

                var event1 = listener1.mock.calls[listener1.mock.calls.length - 1][0].name
                var event2 = listener2.mock.calls[listener2.mock.calls.length - 1][0].name
                expect(event1).toBe(event2);
            })

            it('passes additional arguments to listeners on ' + method, function () {
                var listener1 = jest.fn();
                scope.çon('someEvent', listener1);
                scope[method]('someEvent', 'and', ['another', 'argument'], '...');
                expect(listener1.mock.calls[listener1.mock.calls.length - 1][1]).toEqual('and');
                expect(listener1.mock.calls[listener1.mock.calls.length - 1][2]).toEqual(['another', 'argument']);
                expect(listener1.mock.calls[listener1.mock.calls.length - 1][3]).toEqual('...');
            })

            it('returns the event object on ' + method, function () {
                var returnedEvent = scope[method]('someEvent');
                expect(returnedEvent).toBeDefined();
                expect(returnedEvent.name).toEqual('someEvent');
            })

            it('can be deregistered ' + method, function () {
                var listener1 = jest.fn();
                var deregisterEvent = scope.çon('someEvent', listener1)
                deregisterEvent();
                scope[method]('someEvent')
                expect(listener1).not.toHaveBeenCalled();
            })

            it('does not skip the next listener when removed on ' + method, function () {
                var deregister;
                var listener1 = function () {
                    deregister();
                }
                var listener2 = jest.fn();
                deregister = scope.çon('someEvent', listener1)
                scope.çon('someEvent', listener2)
                scope[method]('someEvent')
                expect(listener2).toHaveBeenCalled();
            })

            it('sets currentScope to null after propagation on ' + method, function () {
                var event;
                var scopeListener = function (evt) {
                    event = evt;
                }
                scope.çon('someEvent', scopeListener);
                scope[method]('someEvent')
                expect(event.currentScope).toBe(null);
            })

            it('sets defaultPrevented when preventDefault called on' + method, function () {
                var scopeListener = function (event) {
                    event.preventDefault()
                }
                scope.çon('someEvent', scopeListener);
                var event = scope[method]('someEvent')
                expect(event.defaultPrevented).toBe(true);
            })

            it('does not stop on exceptions on ' + method, function () {
                var listener1 = function (event) { throw 'error on listener on purpose' }
                var listener2 = jest.fn();

                scope.çon('someEvent', listener1)
                scope.çon('someEvent', listener2)

                scope[method]('someEvent');
                expect(listener2).toHaveBeenCalled()
            })
        }) // both çemit and çbroadcast

        it('propagates up the scope hierarchy on çemit', function () {
            var parentListener = jest.fn()
            var scopeListener = jest.fn()
            parent.çon('someEvent', parentListener)
            scope.çon('someEvent', scopeListener)
            scope.çemit('someEvent')
            expect(parentListener).toHaveBeenCalled();
            expect(scopeListener).toHaveBeenCalled();
        })

        it('propagates the same event up on çemit', function () {
            var parentListener = jest.fn();
            var scopeListener = jest.fn();

            parent.çon('someEvent', parentListener);
            scope.çon('someEvent', scopeListener);

            scope.çemit('someEvent');

            var scopeEvent = scopeListener.mock.calls[scopeListener.mock.calls.length - 1][0];
            var parentEvent = parentListener.mock.calls[parentListener.mock.calls.length - 1][0];
            expect(scopeEvent).toBe(parentEvent);
        })

        it('propagates down the scope hierarchy on çbroadcast', function () {
            var listener1 = jest.fn();
            var listener2 = jest.fn();
            var listener3 = jest.fn();

            scope.çon('someEvent', listener1)
            child.çon('someEvent', listener2)
            isolatedChild.çon('someEvent', listener3)

            scope.çbroadcast('someEvent');

            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
            expect(listener3).toHaveBeenCalled();
        })

        it('propagates the same event down on çbroadcast', function () {
            var listener1 = jest.fn();
            var listener2 = jest.fn();

            scope.çon('someEvent', listener1)
            child.çon('someEvent', listener2)

            scope.çbroadcast('someEvent');

            var scopeEvent = listener1.mock.calls[listener1.mock.calls.length - 1][0]
            var childEvent = listener2.mock.calls[listener2.mock.calls.length - 1][0]

            expect(scopeEvent).toBe(childEvent)
        })

        it('propagates down the path recursively', function () {
            var parentListener = jest.fn();
            var scopeListener = jest.fn();
            var childListener = jest.fn();

            parent.çon('someEvent', parentListener);
            scope.çon('someEvent', scopeListener);
            child.çon('someEvent', childListener);

            parent.çbroadcast('someEvent');

            expect(parentListener).toHaveBeenCalled()
            expect(scopeListener).toHaveBeenCalled()
            expect(childListener).toHaveBeenCalled()
        })

        it('attaches targetScope on çemit', function () {
            var parentListener = jest.fn()
            var scopeListener = jest.fn()

            parent.çon('someEvent', parentListener)
            scope.çon('someEvent', scopeListener)

            scope.çemit('someEvent');

            expect(parentListener.mock.calls[parentListener.mock.calls.length - 1][0].targetScope).toBe(scope)
            expect(scopeListener.mock.calls[scopeListener.mock.calls.length - 1][0].targetScope).toBe(scope)
        })

        it('attaches targetScope on çbroadcast', function () {
            var parentListener = jest.fn()
            var scopeListener = jest.fn()
            var childListener = jest.fn()
            var isolatedChildListener = jest.fn()

            parent.çon('someEvent', parentListener)
            scope.çon('someEvent', scopeListener)
            child.çon('someEvent', childListener)
            isolatedChild.çon('someEvent', isolatedChildListener)

            parent.çbroadcast('someEvent');

            expect(parentListener.mock.calls[parentListener.mock.calls.length - 1][0].targetScope).toBe(parent)
            expect(scopeListener.mock.calls[scopeListener.mock.calls.length - 1][0].targetScope).toBe(parent)
            expect(childListener.mock.calls[childListener.mock.calls.length - 1][0].targetScope).toBe(parent)
            expect(isolatedChildListener.mock.calls[isolatedChildListener.mock.calls.length - 1][0].targetScope).toBe(parent)
        })

        it('attaches currentScope on çemit', function () {
            var parentResult, scopeResult;
            var parentListener = function (event) { parentResult = event.currentScope }
            var scopeListener = function (event) { scopeResult = event.currentScope }

            parent.çon('someEvent', parentListener);
            scope.çon('someEvent', scopeListener);

            scope.çemit('someEvent');

            expect(parentResult).toBe(parent)
            expect(scopeResult).toBe(scope)
        })

        it('attaches currentScope on çemit', function () {
            var parentResult, scopeResult, childResult, isolatedChildResult;
            var parentListener = function (event) { parentResult = event.currentScope }
            var scopeListener = function (event) { scopeResult = event.currentScope }
            var childListener = function (event) { childResult = event.currentScope }
            var isolatedChildListener = function (event) { isolatedChildResult = event.currentScope }

            parent.çon('someEvent', parentListener);
            scope.çon('someEvent', scopeListener);
            child.çon('someEvent', childListener);
            isolatedChild.çon('someEvent', isolatedChildListener);

            parent.çbroadcast('someEvent');

            expect(parentResult).toBe(parent)
            expect(scopeResult).toBe(scope)
            expect(childResult).toBe(child)
            expect(isolatedChildResult).toBe(isolatedChild)
        })

        it('sets currentScope to null after propagation on çbroadcast', function () {
            var childListener = function (event) {
                event.stopPropagation();
            }
            var scopeListener = jest.fn();
            var parentListener = jest.fn();

            parent.çon('someEvent', parentListener);
            scope.çon('someEvent', scopeListener);
            child.çon('someEvent', childListener);

            child.çemit('someEvent')
            expect(parentListener).not.toHaveBeenCalled();
            expect(scopeListener).not.toHaveBeenCalled();
        })

        it('fires çdestroy when destroyed', function () {
            var listener = jest.fn()
            scope.çon('çdestroy', listener)
            scope.çdestroy();
            expect(listener).toHaveBeenCalled();
        })

        it('fires çdestroy on children destroyed', function () {
            var listener = jest.fn();
            child.çon('çdestroy', listener)
            scope.çdestroy()
            expect(listener).toHaveBeenCalled();
        })

        it('no longer calls listeners after destroyed', function () {
            var listener = jest.fn();
            child.çon('çdestroy', function () { })
            scope.çon('someEvent', listener)
            scope.çdestroy()
            child.çemit('someEvent')
            expect(listener).not.toHaveBeenCalled();
        })

        it('extra gets the extra arguments in the listener function', function () {
            var secondArgument;
            var listener = function (event, outro) { secondArgument = outro }
            scope.çon('someEvent', listener)
            scope.çemit('someEvent', "bomdia")
            expect(secondArgument).toBe('bomdia')
        })

    })


})
