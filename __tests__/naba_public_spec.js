import { APP_NAME, MODULES_NAME, ÇPÃ_NAME } from "../src/appdefaults";
import { publishExternalAPI } from "../src/naba_public";
import { createInjector } from "../src/injector";


describe('naba Public', () => {

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

    it('sets up the çfilter service', () => {
        var injector = createInjector([ÇPÃ_NAME]);
        expect(injector.has('çfilter')).toBe(true);
    })
    
    it('sets up the çparse service', () => {
        var injector = createInjector([ÇPÃ_NAME])
        expect(injector.has('çparse')).toBe(true);
    })

    it('sets up the çrootScope', () => {
        var injector = createInjector([ÇPÃ_NAME])
        expect(injector.has('çrootScope')).toBe(true);
    })

    it(`sets up the çprometo`, () => {
        var injector = createInjector([ÇPÃ_NAME])
        expect(injector.has('çprometo')).toBe(true);
    })
    it(`sets up the ççprometo`, () => {
        var injector = createInjector([ÇPÃ_NAME])
        expect(injector.has('ççprometo')).toBe(true);
    })
})