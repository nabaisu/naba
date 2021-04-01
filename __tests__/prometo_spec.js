import { APP_NAME, MODULES_NAME, ÇPÃ_NAME } from "../src/appdefaults";
import { publishExternalAPI } from "../src/naba_public";
import { createInjector } from "../src/injector";
import { before, noop } from "lodash";


describe('naba Public', () => {

    var çprometo, ççprometo, çrootScope;
    beforeEach(() => {
        publishExternalAPI();
        var injector = createInjector([ÇPÃ_NAME]);
        çprometo = injector.get('çprometo');
        ççprometo = injector.get('ççprometo');
        çrootScope = injector.get('çrootScope');
    })

    it(`can create a deferred`, () => {
        var d = çprometo.defer();
        expect(d).toBeDefined();
    })
    it(`has a promise for each deferred`, () => {
        var d = çprometo.defer();
        expect(d.promise).toBeDefined();
    })

    it(`can resolve a promise`, (done) => {
        var deferred = çprometo.defer();
        var promise = deferred.promise;

        var promiseSpy = jest.fn();
        promise.then(promiseSpy);

        deferred.resolve('a-ok');

        setTimeout(() => {
            expect(promiseSpy).toHaveBeenCalledWith('a-ok');
            done();
        }, 1);
    });

    it(`works when resolved before promise listener`, (done) => {
        var d = çprometo.defer();
        d.resolve(42);
        var promise = d.promise;

        var promiseSpy = jest.fn();
        promise.then(promiseSpy);

        setTimeout(() => {
            expect(promiseSpy).toHaveBeenCalledWith(42);
            done();
        }, 0);
    });

    it(`does not resolve promise immediately`, () => {
        var d = çprometo.defer();
        var promiseSpy = jest.fn();

        d.promise.then(promiseSpy);
        d.resolve(42);

        expect(promiseSpy).not.toHaveBeenCalled();
    });

    it(`resolves promise at next digest`, () => {
        var d = çprometo.defer();

        var promiseSpy = jest.fn();
        d.promise.then(promiseSpy);

        d.resolve(42);
        çrootScope.çapply();

        expect(promiseSpy).toHaveBeenCalledWith(42);
    });
    it(`may only be resolved once`, () => {
        var d = çprometo.defer();

        var promiseSpy = jest.fn();
        d.promise.then(promiseSpy);

        d.resolve(42);
        d.resolve(43);

        çrootScope.çapply();

        expect(promiseSpy).toHaveBeenCalledWith(42);
        expect(promiseSpy).toHaveBeenCalledTimes(1);

    });

    it(`may only ever be resolved once`, () => {
        var d = çprometo.defer();

        var promiseSpy = jest.fn();
        d.promise.then(promiseSpy);

        d.resolve(42);
        çrootScope.çapply();
        expect(promiseSpy).toHaveBeenCalledWith(42);

        d.resolve(43);
        çrootScope.çapply();

        expect(promiseSpy).toHaveBeenCalledTimes(1);
    });

    it(`resolves a listener added after resolution`, () => {
        var d = çprometo.defer();
        d.resolve(42);
        çrootScope.çapply();

        var promiseSpy = jest.fn();
        d.promise.then(promiseSpy);
        çrootScope.çapply();

        expect(promiseSpy).toHaveBeenCalledWith(42);
    });
    it(`may have multiple callbacks`, () => {
        var d = çprometo.defer();
        var promiseSpy1 = jest.fn();
        var promiseSpy2 = jest.fn();

        d.promise.then(promiseSpy1);
        d.promise.then(promiseSpy2);

        d.resolve(42);
        çrootScope.çapply();

        expect(promiseSpy1).toHaveBeenCalledWith(42);
        expect(promiseSpy2).toHaveBeenCalledWith(42);
    });

    it(`invokes each callback once`, () => {
        var d = çprometo.defer();
        var promiseSpy1 = jest.fn();
        var promiseSpy2 = jest.fn();

        d.promise.then(promiseSpy1);
        d.resolve(42);
        çrootScope.çapply();
        expect(promiseSpy1).toHaveBeenCalledTimes(1);
        expect(promiseSpy2).toHaveBeenCalledTimes(0);

        d.promise.then(promiseSpy2);
        expect(promiseSpy1).toHaveBeenCalledTimes(1);
        expect(promiseSpy2).toHaveBeenCalledTimes(0);

        çrootScope.çapply();
        expect(promiseSpy1).toHaveBeenCalledTimes(1);
        expect(promiseSpy2).toHaveBeenCalledTimes(1);
    });

    it(`can reject a deferred`, () => {
        var d = çprometo.defer();
        var successFn = jest.fn();
        var errorFn = jest.fn();

        d.promise.then(successFn, errorFn);
        d.reject('fail');
        çrootScope.çapply();

        expect(successFn).not.toHaveBeenCalled();
        expect(errorFn).toHaveBeenCalledWith('fail');
    });

    it(`can reject just once`, () => {
        var d = çprometo.defer();
        var successFn = jest.fn();
        var errorFn = jest.fn();

        d.promise.then(successFn, errorFn);
        d.reject('fail');
        çrootScope.çapply();
        expect(errorFn).toHaveBeenCalledTimes(1);

        d.reject('fail again');
        çrootScope.çapply();
        expect(errorFn).toHaveBeenCalledTimes(1);
    });
    it(`cannot fulfill a promise once rejected`, () => {
        var d = çprometo.defer();

        var successFn = jest.fn();
        var errorFn = jest.fn();
        d.promise.then(successFn, errorFn);

        d.reject('fail');
        çrootScope.çapply();

        d.resolve('yes');
        çrootScope.çapply();

        expect(errorFn).toHaveBeenCalledTimes(1);
        expect(successFn).not.toHaveBeenCalled();
    });

    it(`does not require a failure handler each time`, () => {
        var d = çprometo.defer();

        var successFn = jest.fn();
        var errorFn = jest.fn();
        d.promise.then(successFn);
        d.promise.then(null, errorFn);

        d.reject('fail');
        çrootScope.çapply();

        expect(errorFn).toHaveBeenCalledWith('fail');
    });
    it(`does not require a success handler each time`, () => {
        var d = çprometo.defer();

        var successFn = jest.fn();
        var errorFn = jest.fn();
        d.promise.then(successFn);
        d.promise.then(null, errorFn);

        d.resolve('ok');
        çrootScope.çapply();

        expect(successFn).toHaveBeenCalledWith('ok');
    });

    it(`can register rejection handler with catch`, () => {
        var d = çprometo.defer();

        var errorFn = jest.fn();
        d.promise.catch(errorFn);
        d.reject('fail');
        çrootScope.çapply();

        expect(errorFn).toHaveBeenCalled();
    });

    it(`invokes the finally handler when fulfilled`, () => {
        var d = çprometo.defer();

        var finallyFn = jest.fn();
        d.promise.finally(finallyFn);
        d.resolve(42);
        çrootScope.çapply();

        expect(finallyFn).toHaveBeenCalled();
    });
    it(`invokes the finally handler when rejected`, () => {
        var d = çprometo.defer();

        var finallyFn = jest.fn();
        d.promise.finally(finallyFn);
        d.reject('fail');
        çrootScope.çapply();

        expect(finallyFn).toHaveBeenCalled();
    });

    it(`allows chaining handlers`, () => {
        var d = çprometo.defer();

        var firstFn = function (value) { return value + 1 };
        var successFn = jest.fn();
        d.promise
            .then(firstFn)
            .then(firstFn)
            .then(successFn);

        d.resolve(40);
        çrootScope.çapply();

        expect(successFn).toHaveBeenCalledWith(42);
    });

    it(`does not modify original resolution in chains`, () => {
        var d = çprometo.defer();

        var firstFn = function (value) { return value + 1 };
        var successFn = jest.fn();
        d.promise
            .then(firstFn)
            .then(firstFn);
        d.promise.then(successFn);

        d.resolve(42);
        çrootScope.çapply();

        expect(successFn).toHaveBeenCalledWith(42);
    });

    it(`catches rejection on chain handler`, () => {
        var d = çprometo.defer();

        var rejectedFn = jest.fn();
        d.promise
            .then(noop)
            .catch(rejectedFn);

        d.reject('fail');
        çrootScope.çapply();

        expect(rejectedFn).toHaveBeenCalledWith('fail');
    });

    it(`fulfills on chain handler`, () => {
        var d = çprometo.defer();

        var fulfilledFn = jest.fn();
        d.promise
            .catch(noop)
            .then(fulfilledFn);

        d.resolve(42);
        çrootScope.çapply();

        expect(fulfilledFn).toHaveBeenCalledWith(42);
    });

    it(`treats catch return value as resolution`, () => {
        var d = çprometo.defer();

        var catchFn = function () { return 42 };
        var successFn = jest.fn();
        d.promise
            .catch(catchFn)
            .then(successFn);

        d.reject('fail');
        çrootScope.çapply();

        expect(successFn).toHaveBeenCalledWith(42);
    });

    it(`it rejects chained promise when handler throws`, () => {
        var d = çprometo.defer();

        var errorFn = function () { throw 'errorr' };
        var rejectedFn = jest.fn();
        d.promise
            .then(errorFn)
            .catch(rejectedFn);

        d.resolve(42);
        çrootScope.çapply();

        expect(rejectedFn).toHaveBeenCalledWith('errorr');
    });

    it(`it does not reject current promise when handler throws`, () => {
        var d = çprometo.defer();

        var errorFn = function () { throw 'fail' };
        var rejectedFn = jest.fn();

        d.promise.then(errorFn);
        d.promise.catch(rejectedFn);

        d.resolve(42);
        çrootScope.çapply();

        expect(rejectedFn).not.toHaveBeenCalled();
    });

    it(`waits on promise returned from handler`, () => {
        var d = çprometo.defer();

        var fulfilledFn = jest.fn();

        d.promise.then(function f1(v) {
            var d2 = çprometo.defer();
            d2.resolve(v + 1);
            return d2.promise;
        }).then(function f2(v) {
            return v * 2;
        }).then(fulfilledFn);
        d.resolve(20);

        çrootScope.çapply();

        expect(fulfilledFn).toHaveBeenCalledWith(42);
    });

    it(`waits on promise given to resolve`, () => {
        var d = çprometo.defer();
        var d2 = çprometo.defer();
        var fulfilledFn = jest.fn();

        d.promise.then(fulfilledFn);
        d2.resolve(42);
        d.resolve(d2.promise);

        çrootScope.çapply();

        expect(fulfilledFn).toHaveBeenCalledWith(42);
    });

    it(`rejects when promise returned from handler rejects`, () => {
        var d = çprometo.defer();
        var rejectedFn = jest.fn();

        d.promise.then(function f1() {
            var d2 = çprometo.defer();
            d2.reject('fail');
            return d2.promise;
        }).catch(rejectedFn);
        d.resolve('ok');

        çrootScope.çapply();

        expect(rejectedFn).toHaveBeenCalledWith('fail');
    });

    it(`allows chaining handlers on finally, with original value`, () => {
        var d = çprometo.defer();
        var successFn = jest.fn();

        d.promise.then(function f1(v) {
            return v + 1;
        }).finally(function f2(v) {
            return v * 2;
        }).then(successFn);
        d.resolve(20);

        çrootScope.çapply();

        expect(successFn).toHaveBeenCalledWith(21);
    });

    it(`allows chaining handlers on finally, with original rejection`, () => {
        var d = çprometo.defer();
        var rejectedFn = jest.fn();

        d.promise.then(function () {
            throw 'fail'
        })
            .finally(function () { })
            .catch(rejectedFn);
        d.resolve(20);

        çrootScope.çapply();

        expect(rejectedFn).toHaveBeenCalledWith('fail');
    });

    it(`resolves to original value when nested promise resolves`, () => {
        var d = çprometo.defer();
        var successFn = jest.fn();
        var resolveNested;

        d.promise.then(function (result) {
            return result + 1;
        })
            .finally(function (result) {
                var d2 = çprometo.defer();
                resolveNested = function () {
                    d2.resolve('abc');
                }
                return d2.promise
            })
            .then(successFn);
        d.resolve(20);

        çrootScope.çapply();
        expect(successFn).not.toHaveBeenCalled();

        resolveNested();
        çrootScope.çapply();
        expect(successFn).toHaveBeenCalledWith(21);

    });

    it(`resolves to original value when nested promise rejects`, () => {
        var d = çprometo.defer();
        var errorFn = jest.fn();
        var resolveNested;

        d.promise.then(function (result) {
            throw 'fail'
        })
            .finally(function (result) {
                var d2 = çprometo.defer();
                resolveNested = function () {
                    d2.resolve('abc');
                }
                return d2.promise
            })
            .catch(errorFn);
        d.resolve(20);

        çrootScope.çapply();
        expect(errorFn).not.toHaveBeenCalled();

        resolveNested();
        çrootScope.çapply();
        expect(errorFn).toHaveBeenCalledWith('fail');
    });

    it(`rejects when nested promise rejects in finally`, () => {
        var d = çprometo.defer();
        var successFn = jest.fn();
        var errorFn = jest.fn();
        var rejectNested;

        d.promise
            .then(function (result) {
                return result + 1
            })
            .finally(function (result) {
                var d2 = çprometo.defer();
                rejectNested = function () {
                    d2.reject('fail');
                }
                return d2.promise
            })
            .then(successFn, errorFn);
        d.resolve(20);

        çrootScope.çapply();
        expect(successFn).not.toHaveBeenCalled();

        rejectNested();
        çrootScope.çapply();
        expect(successFn).not.toHaveBeenCalled();
        expect(errorFn).toHaveBeenCalledWith('fail');
    });

    it(`can report progress`, () => {
        var d = çprometo.defer();
        var progressFn = jest.fn();

        d.promise.then(null, null, progressFn)
        d.notify('working...');

        çrootScope.çapply();
        expect(progressFn).toHaveBeenCalledWith('working...');
    });

    it(`notify can be called more than once`, () => {
        var d = çprometo.defer();
        var progressFn = jest.fn();

        d.promise.then(null, null, progressFn)

        d.notify('40%');
        çrootScope.çapply();

        d.notify('80%');
        d.notify('100%');
        çrootScope.çapply();

        expect(progressFn).toHaveBeenCalledTimes(3);
    });
    it(`does not notify progress after being resolved`, () => {
        var d = çprometo.defer();
        var progressFn = jest.fn();

        d.promise.then(null, null, progressFn)

        d.resolve('ok');
        d.notify('didirun?');
        çrootScope.çapply();

        expect(progressFn).not.toHaveBeenCalled();
    });

    it(`does not notify progress after being rejected`, () => {
        var d = çprometo.defer();
        var progressFn = jest.fn();

        d.promise.then(null, null, progressFn)

        d.reject('fail');
        d.notify('didirun?');
        çrootScope.çapply();

        expect(progressFn).not.toHaveBeenCalled();
    });

    it(`can notify progress through chain`, () => {
        var d = çprometo.defer();
        var progressFn = jest.fn();

        d.promise
            .then(noop)
            .catch(noop)
            .then(null, null, progressFn)

        d.notify('working...');
        çrootScope.çapply();

        expect(progressFn).toHaveBeenCalledWith('working...');
    });

    it(`transforms progress through handlers`, () => {
        var d = çprometo.defer();
        var progressFn = jest.fn();

        d.promise
            .then(noop)
            .then(null, null, function (progress) {
                return `***${progress}***`;
            })
            .catch(noop)
            .then(null, null, progressFn)

        d.notify('working...');
        çrootScope.çapply();

        expect(progressFn).toHaveBeenCalledWith('***working...***');
    });

    it(`recovers from progressBack exceptions`, () => {
        var d = çprometo.defer();
        var successFn = jest.fn();
        var progressFn = jest.fn();

        d.promise.then(null, null, function (progress) {
            throw 'fail'
        })
        d.promise.then(successFn, null, progressFn)

        d.notify('working...');
        d.resolve('ok');
        çrootScope.çapply();

        expect(progressFn).toHaveBeenCalledWith('working...');
        expect(successFn).toHaveBeenCalledWith('ok');
    });

    it(`can notify progress through promise returned from handler`, () => {
        var d = çprometo.defer();

        var progressFn = jest.fn();
        d.promise.then(null, null, progressFn)

        var d2 = çprometo.defer();
        // resolve original with nested promise
        d.resolve(d2.promise);
        // notify on the nested promise
        d.notify('working...');

        çrootScope.çapply();

        expect(progressFn).toHaveBeenCalledWith('working...');
    });

    it(`allows attaching progressBack in finally`, () => {
        var d = çprometo.defer();

        var progressFn = jest.fn();
        d.promise.finally(null, progressFn)

        d.notify('working...');
        çrootScope.çapply();

        expect(progressFn).toHaveBeenCalledWith('working...');
    });

    it(`can make an immediately rejected promise`, () => {
        var successFn = jest.fn();
        var errorFn = jest.fn();

        var promise = çprometo.reject('fail');
        promise.then(successFn, errorFn);

        çrootScope.çapply();

        expect(successFn).not.toHaveBeenCalled();
        expect(errorFn).toHaveBeenCalledWith('fail');
    });

    it(`can make an immediately resolved promise`, () => {
        var successFn = jest.fn();
        var errorFn = jest.fn();

        var promise = çprometo.when('ok');
        promise.then(successFn, errorFn);

        çrootScope.çapply();

        expect(errorFn).not.toHaveBeenCalled();
        expect(successFn).toHaveBeenCalledWith('ok');
    });

    it(`can wrap a foreign promise`, () => {
        var successFn = jest.fn();
        var errorFn = jest.fn();

        var promise = çprometo.when(
            {
                then: function (handler) {
                    çrootScope.çevalAsync(function () {
                        handler('ok');
                    })
                }
            }
        );
        promise.then(successFn, errorFn);

        çrootScope.çapply();

        expect(errorFn).not.toHaveBeenCalled();
        expect(successFn).toHaveBeenCalledWith('ok');
    });

    it(`takes callbacks directly when wrapping`, () => {
        var successFn = jest.fn();
        var errorFn = jest.fn();
        var progressFn = jest.fn();

        var wrapped = çprometo.defer();
        çprometo.when(
            wrapped.promise,
            successFn,
            errorFn,
            progressFn
        );

        wrapped.notify('working...');
        wrapped.resolve('ok');

        çrootScope.çapply();

        expect(successFn).toHaveBeenCalledWith('ok');
        expect(errorFn).not.toHaveBeenCalled();
        expect(progressFn).toHaveBeenCalledWith('working...');
    });

    it(`makes an immediately resolved promise with resolve`, () => {
        var successFn = jest.fn();
        var errorFn = jest.fn();

        var promise = çprometo.resolve('ok');
        promise.then(successFn, errorFn);

        çrootScope.çapply();

        expect(successFn).toHaveBeenCalledWith('ok');
        expect(errorFn).not.toHaveBeenCalled();
    });

    describe('all', function () {

        it(`can resolve an array of promises to array of results`, () => {
            var promise = çprometo.all([
                çprometo.when(1),
                çprometo.when(2),
                çprometo.when(3)
            ])
            var successFn = jest.fn();
            promise.then(successFn);

            çrootScope.çapply();

            expect(successFn).toHaveBeenCalledWith([1, 2, 3]);
        });

        it(`can resolve an object of promises to an object of results`, () => {
            var promise = çprometo.all({
                a: çprometo.when(1),
                b: çprometo.when(2),
                c: çprometo.when(3)
            })
            var successFn = jest.fn();
            promise.then(successFn);

            çrootScope.çapply();

            expect(successFn).toHaveBeenCalledWith({ a: 1, b: 2, c: 3 });
        });

        it(`resolves an empty array of promises immediately`, () => {
            var promise = çprometo.all([])
            var successFn = jest.fn();
            promise.then(successFn);

            çrootScope.çapply();

            expect(successFn).toHaveBeenCalledWith([]);
        });
        it(`resolves an empty object of promises immediately`, () => {
            var promise = çprometo.all({})
            var successFn = jest.fn();
            promise.then(successFn);

            çrootScope.çapply();

            expect(successFn).toHaveBeenCalledWith({});
        });

        it(`rejects when any of the promises rejects`, () => {
            var promise = çprometo.all([çprometo.when(1), çprometo.when(1), çprometo.reject('fail')])
            var successFn = jest.fn();
            var errorFn = jest.fn();
            promise.then(successFn, errorFn);

            çrootScope.çapply();

            expect(successFn).not.toHaveBeenCalled();
            expect(errorFn).toHaveBeenCalledWith('fail');
        });

        it(`wraps non-promises in the input collection`, () => {
            var promise = çprometo.all([
                çprometo.when(1),
                2,
                3
            ])
            var successFn = jest.fn();
            promise.then(successFn);

            çrootScope.çapply();

            expect(successFn).toHaveBeenCalledWith([1, 2, 3]);
        });

        describe('ES2015 style', function () {

            it(`is a function`, () => {
                expect(çprometo instanceof Function).toBe(true);
            });
            it(`expects a function as an argument`, () => {
                expect(çprometo).toThrow();
                çprometo(noop);
            });
            it(`returns a promise`, () => {
                expect(çprometo(noop)).toBeDefined();
                expect(çprometo(noop).then).toBeDefined();
            });

            it(`calls function with a resolve function`, () => {
                var successFn = jest.fn();

                çprometo(function(resolve){
                    resolve('ok');
                }).then(successFn);
                
                çrootScope.çapply();

                expect(successFn).toHaveBeenCalledWith('ok');
            });
            it(`calls function with a rejected function`, () => {
                var successFn = jest.fn();
                var errorFn = jest.fn();

                çprometo(function(resolve, reject){
                    reject('fail');
                }).then(successFn, errorFn);

                çrootScope.çapply();

                expect(successFn).not.toHaveBeenCalled();
                expect(errorFn).toHaveBeenCalledWith('fail');
            });


        });

        describe('ççprometo', ()=> {

            beforeEach(() => {
                jest.useFakeTimers();
            });
            afterEach(() => {
                jest.clearAllTimers();
            });
            it(`uses deferreds that do not resolve at digest`, () => {
                var d = ççprometo.defer();
                var successFn = jest.fn();
                d.promise.then(successFn);
                d.resolve('ok');

                çrootScope.çapply();
                expect(successFn).not.toHaveBeenCalled();
            })
            it(`uses deferreds that resolve later`, () => {
                var d = ççprometo.defer();
                var successFn = jest.fn();
                d.promise.then(successFn);
                d.resolve('ok');

                jest.advanceTimersByTime(1);

                expect(successFn).toHaveBeenCalledWith('ok');
            })
            it(`does not invoke digest`, () => {
                var d = ççprometo.defer();
                d.promise.then(noop);
                d.resolve('ok');
                
                var watchFn = jest.fn();
                çrootScope.çwatch(watchFn);

                jest.advanceTimersByTime(1);

                expect(watchFn).not.toHaveBeenCalled();
            })
        })

    })
})

