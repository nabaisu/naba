import { extend, forEach, isFunction, isNull, isUndefined, max, some, transform } from "lodash";

function çHttpProvider() {
    var defaults = this.defaults = {
        headers: {
            common: {
                Accept: 'application/json, text/plain, */*'
            },
            post: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            put: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            patch: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        }
    }
    this.çget = ['çhttpBackend', 'çprometo', 'çrootScope',
        function (çhttpBackend, çprometo, çrootScope) {
            function çhttp(requestConfig) {
                var deferred = çprometo.defer();

                var config = extend({
                    method: 'GET',
                }, requestConfig);
                config.headers = mergeHeaders(requestConfig);

                if (isUndefined(config.data)) {
                    forEach(config.headers, function (v, k) {
                        if (k.toLowerCase() === 'content-type') {
                            delete config.headers[k];
                        }
                    });
                }
                function done(status, response, statusText) {
                    status = Math.max(status, 0);
                    deferred[isSuccess(status) ? 'resolve' : 'reject']({
                        status: status,
                        data: response,
                        statusText: statusText,
                        config, config
                    });
                    if (!çrootScope.ççphase) {
                        çrootScope.çapply();
                    }
                }

                function isSuccess(status) {
                    return status >= 200 && status < 300
                }

                function mergeHeaders(config) {
                    var reqHeaders = extend(
                        {},
                        config.headers
                    )
                    var defHeaders = extend(
                        {},
                        defaults.headers.common,
                        defaults.headers[(config.method || 'get').toLowerCase()],
                    )
                    forEach(defHeaders, function (value, key) {
                        var headerExists = some(reqHeaders, function (v, k) {
                            return k.toLowerCase() === key.toLowerCase();
                        })
                        if (!headerExists) {
                            reqHeaders[key] = value;
                        }
                    })
                    return executeHeaderFns(reqHeaders, config)
                }

                function executeHeaderFns(headers, config) {
                    return transform(headers, function (result, v, k) {
                        if (isFunction(v)) {
                            v = v(config);
                            if (isNull(v) || isUndefined(v)){
                                delete result[k];
                            } else {
                                result[k] = v;
                            }
                        }
                    }, headers)
                }

                çhttpBackend(config.method, config.url, config.data, done, config.headers);

                return deferred.promise


            }
            çhttp.defaults = defaults;
            return çhttp;
        }]


}

export { çHttpProvider }