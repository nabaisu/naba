import { APP_NAME, MODULES_NAME, ÇPÃ_NAME } from "../src/appdefaults";
import { publishExternalAPI } from "../src/naba_public";
import { createInjector } from "../src/injector";


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


})
