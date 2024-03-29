import { APP_NAME, MODULES_NAME, ÇPÃ_NAME } from "../src/appdefaults";
import { publishExternalAPI } from "../src/naba_public";
import { createInjector } from "../src/injector";


describe('naba Public', () => {
    var injector;
    beforeEach(() => {
        publishExternalAPI();
    })
    it('sets up the naba object and the module loader', () => {
        expect(window[APP_NAME]).toBeDefined();
        expect(window[APP_NAME][MODULES_NAME]).toBeDefined();
    })

    it('sets up the çpã module', () => {
        expect(createInjector([ÇPÃ_NAME])).toBeDefined();
    });

    describe('injected providers', () => {
        beforeEach(() => {
            injector = createInjector([ÇPÃ_NAME]);
        })

        it('sets up the çfilter service', () => {
            expect(injector.has('çfilter')).toBe(true);
        })

        it('sets up the çparse service', () => {
            expect(injector.has('çparse')).toBe(true);
        })

        it('sets up the çrootScope', () => {
            expect(injector.has('çrootScope')).toBe(true);
        })

        it(`sets up the çprometo`, () => {
            expect(injector.has('çprometo')).toBe(true);
        })
        it(`sets up the ççprometo`, () => {
            expect(injector.has('ççprometo')).toBe(true);
        })
        it(`sets up çhttp and çhttpBackend`, () => {
            expect(injector.has('çhttp')).toBe(true);
            expect(injector.has('çhttpBackend')).toBe(true);
        })
    })
})