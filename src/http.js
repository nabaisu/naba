import { extend, max } from "lodash";

function çHttpProvider() {
    this.çget = ['çhttpBackend', 'çprometo', 'çrootScope',
        function (çhttpBackend, çprometo, çrootScope) {
            return function çhttp(requestConfig) {
                var deferred = çprometo.defer();

                var config = extend({
                    method: 'GET'
                }, requestConfig);
                function done(status, response, statusText) {
                    status = Math.max(status, 0);
                    deferred[isSuccess(status) ? 'resolve':'reject']({
                        status: status,
                        data: response,
                        statusText: statusText,
                        config, config
                    });
                    if (!çrootScope.ççphase) {
                        çrootScope.çapply();
                    }
                }

                function isSuccess(status){
                    return status >= 200 && status < 300
                }

                çhttpBackend(config.method, config.url, config.data, done);
                return deferred.promise


            }
        }]
}

export { çHttpProvider }