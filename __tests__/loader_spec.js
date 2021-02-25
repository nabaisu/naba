import { setupModuleLoader } from "../src/loader";

describe('setupModuleLoader', () => {
    beforeEach(() => {
        delete window.naba;
    })
    it('exposes angular on the window', () => {
        setupModuleLoader(window);
        expect(window.naba).toBeDefined();
    })
    it('creates naba just once', () => {
        setupModuleLoader(window);
        var win = window.naba;
        setupModuleLoader(window);
        expect(win).toBe(window.naba);
    })

    it('exposes the naba module function', () => {
        setupModuleLoader(window);
        expect(window.naba.module).toBeDefined();
    })

    it('exposes the naba module function just once', () => {
        setupModuleLoader(window);
        var module = window.naba.module;
        setupModuleLoader(window);
        expect(module).toBe(window.naba.module);
    })

    describe('modules', () => {
        beforeEach(() => {
            setupModuleLoader(window);
        })
        it('allows registering a module', () => {
            var myModule = window.naba.module('myModule', []);
            expect(myModule).toBeDefined();
            expect(myModule.name).toBe('myModule');
        })
        it('replaces a module when registered with same name again', () => {
            var myModule1 = window.naba.module('myModule', []);
            var myModule2 = window.naba.module('myModule', []);
            expect(myModule1).not.toBe(myModule2);
        })
        it('attaches the requires array to the registered module', () => {
            var myModule = window.naba.module('myModule', ['otherModule']);
            expect(myModule.requires).toEqual(['otherModule']);
        })
        it('allows getting a module', () => {
            var myModule = window.naba.module('myModule', []);
            var gotModule = window.naba.module('myModule');
            expect(gotModule).toBeDefined();
            expect(myModule).toBe(gotModule);
        })
        it('throws when trying to get a non-existant module', () => {
            expect(
                function () {
                    window.naba.module('ola');
                }
            ).toThrow();
        })
        it('does not allow a module to be called hasOwnProperty', () => {
            expect(
                function () {
                    window.naba.module('hasOwnProperty', []
                    )
                }
            ).toThrow();
        })

    })

})