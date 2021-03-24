import { APP_NAME, MODULES_NAME, ÇPÃ_NAME } from "./appdefaults";
import { setupModuleLoader } from "./loader";
import { çFilterProvider } from './filter';
import { çRootScopeProvider } from './scope';
import çParseProvider from "./parse";

var publishExternalAPI = function () {
    setupModuleLoader(window);
    var çpãModule = window[APP_NAME][MODULES_NAME](ÇPÃ_NAME, []);
    çpãModule.provider('çfilter', çFilterProvider);
    çpãModule.provider('çparse', çParseProvider);
    çpãModule.provider('çrootScope', çRootScopeProvider);
};

export { publishExternalAPI };