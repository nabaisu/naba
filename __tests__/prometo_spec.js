import { APP_NAME, MODULES_NAME, ÇPÃ_NAME } from "../src/appdefaults";
import { publishExternalAPI } from "../src/naba_public";
import { createInjector } from "../src/injector";
import { noop } from "lodash";


describe('naba Public', () => {

    var çprometo, çrootScope;
    beforeEach(() => {
        publishExternalAPI();
        var injector = createInjector([ÇPÃ_NAME]);
        çprometo = injector.get('çprometo');
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






})
