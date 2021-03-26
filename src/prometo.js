import { forEach, isFunction, bind } from "lodash";

function çPrometoProvider() {
    this.çget = ['çrootScope', function (çrootScope) {

        function Deferred() {
            this.promise = new Promise();
        }
        Deferred.prototype.resolve = function (value) {
            // to make some tests work, instead of the eval async, to run something in the future, one can call setTimeout with 0
            if (this.promise.ççstate.status) {
                return
            }
            if (value && isFunction(value.then)) {
                value.then(
                    bind(this.resolve, this),
                    bind(this.reject, this)
                );
            } else {
                this.promise.ççstate.value = value;
                this.promise.ççstate.status = 1; // means resolved
                scheduleProcessQueue(this.promise.ççstate);
            }
        }

        Deferred.prototype.reject = function (reason) {
            if (this.promise.ççstate.status) {
                return
            }
            this.promise.ççstate.value = reason; // means rejected
            this.promise.ççstate.status = 2; // means rejected
            scheduleProcessQueue(this.promise.ççstate);
        }

        function Promise() {
            this.ççstate = {}
        }

        Promise.prototype.then = function (onFulfilled, onRejected) {
            var result = new Deferred();
            this.ççstate.pending = this.ççstate.pending || [];
            this.ççstate.pending.push([result, onFulfilled, onRejected]); // isto é com base no status index
            if (this.ççstate.status > 0) {
                scheduleProcessQueue(this.ççstate);
            }
            return result.promise;
        }

        Promise.prototype.catch = function (onRejected) {
            return this.then(null, onRejected);
        }

        Promise.prototype.finally = function (callback) {
            return this.then(
                function (value) {
                    return handleFinallyCallback(callback, value, true);
                }, function (rejection) {
                    return handleFinallyCallback(callback, rejection, false);
                })
            // basicamente assina-se ao onFullfilled e ao onRejected o chamamento da callback
        }

        function defer() {
            return new Deferred();
        }

        function scheduleProcessQueue(state) {
            çrootScope.çevalAsync(function () {
                processQueue(state);
            });
        }

        function processQueue(state) {
            var pending = state.pending;
            state.pending = undefined;
            forEach(pending, function (handlers) {
                var deferred = handlers[0];
                var fn = handlers[state.status]; // isto é interessante porque ele vai passando o state entre eles
                try {
                    if (isFunction(fn)) {
                        deferred.resolve(fn(state.value)); // aqui já meteu recursão para xuxu
                    } else if (state.status === 1) {
                        deferred.resolve(state.value); // aqui já meteu recursão para xuxu
                    } else {
                        deferred.reject(state.value);
                    }
                } catch (error) {
                    deferred.reject(error);
                }
            })
        }

        function makePromise(value, resolved) {
            var d = new Deferred();
            if (resolved) {
                d.resolve(value);
            } else {
                d.reject(value)
            }
            return d.promise
        }

        function handleFinallyCallback(callback, value, resolved) {
            var callbackValue = callback();
            if (callbackValue && callbackValue.then) {
                return callbackValue.then(function () {
                    return makePromise(value, resolved);
                });
            } else {
                return makePromise(value, resolved);
            }
        }

        return {
            defer: defer
        }
    }]
}

export { çPrometoProvider }