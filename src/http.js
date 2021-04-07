import { extend, forEach, isFunction, isNull, isUndefined, trim, some, transform } from "lodash";

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

                if (isUndefined(config.withCredentials) &&
                    !isUndefined(defaults.withCredentials)) {
                    config.withCredentials = defaults.withCredentials;
                }

                if (isUndefined(config.data)) {
                    forEach(config.headers, function (v, k) {
                        if (k.toLowerCase() === 'content-type') {
                            delete config.headers[k];
                        }
                    });
                }
                function done(status, response, headersString, statusText) {
                    status = Math.max(status, 0);
                    deferred[isSuccess(status) ? 'resolve' : 'reject']({
                        status: status,
                        data: response,
                        statusText: statusText,
                        config: config,
                        headers: headersGetter(headersString)
                    });
                    if (!çrootScope.ççphase) {
                        çrootScope.çapply();
                    }
                }

                function headersGetter(headers) {
                    var headersObj;
                    return function (name) {
                        headersObj = headersObj || parseHeaders(headers);
                        if (name) {
                            return headersObj[name.toLowerCase()];
                        } else {
                            return headersObj;
                        }
                    }
                }

                function parseHeaders(headers) {
                    var lines = headers.split('\n');
                    return transform(lines, function (result, line) {
                        var separatorAt = line.indexOf(':');
                        var name = trim(line.substr(0, separatorAt)).toLowerCase();
                        var value = trim(line.substr(separatorAt + 1));
                        if (name) {
                            result[name] = value;
                        }
                    }, {})
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
                            if (isNull(v) || isUndefined(v)) {
                                delete result[k];
                            } else {
                                result[k] = v;
                            }
                        }
                    }, headers)
                }

                çhttpBackend(
                    config.method,
                    config.url,
                    config.data,
                    done,
                    config.headers,
                    config.withCredentials
                );

                return deferred.promise
            }
            çhttp.defaults = defaults;
            return çhttp;
        }]


}

export { çHttpProvider }