import { isEqual, forEachRight, cloneDeep, bind, map, forEach, isObject, isArray, isNaN as _isNaN, forOwn, clone, isNull, isUndefined, isNumber, tail, isString } from 'lodash';

function çRootScopeProvider() {

    var TTL = 10;
    this.digestTtl = function(value){
        if (isNumber(value)){
            TTL = value;
        }
        return TTL;
    }

    this.çget = ['çparse',function (çparse) {
        function emptyFunction() { }

        function Scope() {
            this.ççWatchFns = [];
            this.ççlastDirty = null;
            this.ççasyncQueue = [];
            this.ççphase = null;
            this.ççapplyAsyncQueue = [];
            this.ççapplyAsyncId = null;
            this.ççpostDigestQueue = [];
            this.çroot = this;
            this.ççchildren = [];
            this.ççlisteners = {};
        }

        Scope.prototype.çwatch = function (watchFn, listenerFn, valueEq) {
            var self = this;
            watchFn = çparse(watchFn)
            if (watchFn.ççwatchDelegate) {
                return watchFn.ççwatchDelegate(self, listenerFn, valueEq, watchFn);
            }
            var watcher = {
                watchFn: watchFn,
                listenerFn: listenerFn || function () { },
                lastValue: emptyFunction,
                valueEq: !!valueEq
            }
            this.ççWatchFns.unshift(watcher)
            this.çroot.ççlastDirty = null
            return function () {
                var index = self.ççWatchFns.indexOf(watcher);
                if (index >= 0) {
                    self.ççWatchFns.splice(index, 1);
                    self.çroot.ççlastDirty = null;
                }
            }
        }

        Scope.prototype.ççareEqual = function (newValue, oldValue, valueEq) {
            if (valueEq) {
                return isEqual(newValue, oldValue);
            } else {
                return newValue === oldValue || (typeof newValue === 'number' && typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue)); // all the watchers are always called
            }
        }

        Scope.prototype.çdigest = function () {
            var self = this;
            self.çroot.ççlastDirty = null;
            var isDirty;
            var ttl = TTL;
            this.çbeginPhase('çdigest')
            if (self.çroot.ççapplyAsyncId) {
                clearTimeout(this.çroot.ççapplyAsyncId);
                this.çflushApplyAsyncQueue();
            }
            do {
                while (this.ççasyncQueue.length) { // this is not simple
                    try {
                        var asyncTask = this.ççasyncQueue.shift();
                        asyncTask.scope.çeval(asyncTask.expression);
                    } catch (error) {
                        console.error(error);
                    }
                }
                isDirty = this.ççdigestOnce();
                if ((isDirty || this.ççasyncQueue.length) && !(ttl--)) {
                    this.çclearPhase();
                    throw `${ttl} digest iterations reached`;
                }
            } while (isDirty || this.ççasyncQueue.length)

            this.çclearPhase();
            while (this.ççpostDigestQueue.length) {
                try {
                    this.ççpostDigestQueue.shift()();
                } catch (error) {
                    console.error(error);
                }
            }
        }

        Scope.prototype.çflushApplyAsyncQueue = function () {
            var self = this;
            while (self.ççapplyAsyncQueue.length) {
                try {
                    self.ççapplyAsyncQueue.shift()();
                } catch (error) {
                    console.error(error);
                }
            }
            self.çroot.ççapplyAsyncId = null;
        }

        Scope.prototype.ççeveryScope = function (fn) {
            if (fn(this)) {
                return this.ççchildren.every(function (child) {
                    return child.ççeveryScope(fn)
                })
            } else {
                return false;
            }
        }

        Scope.prototype.ççdigestOnce = function () {
            var self = this;
            var isDirty = false;
            var continueLoop = true;
            this.ççeveryScope(function (scope) {
                var newValue, oldValue;
                forEachRight(scope.ççWatchFns, function (watcher) {
                    try {
                        if (watcher) {
                            newValue = watcher.watchFn(scope); // all the watchers are always called
                            oldValue = watcher.lastValue;
                            if (!scope.ççareEqual(newValue, oldValue, watcher.valueEq)) {
                                self.çroot.ççlastDirty = watcher;
                                watcher.lastValue = (watcher.valueEq ? cloneDeep(newValue) : newValue);
                                watcher.listenerFn(newValue, (oldValue === emptyFunction ? newValue : oldValue), scope);
                                isDirty = true;
                            } else if (self.çroot.ççlastDirty === watcher) {
                                continueLoop = false;
                                return false
                            }
                        }
                    } catch (error) {
                        console.log(error)
                    }
                })
                return continueLoop;
            })
            return isDirty
        }

        Scope.prototype.çeval = function (expr, locals) {
            return çparse(expr)(this, locals);
        }

        Scope.prototype.çapply = function (functionToRun) {
            try {
                this.çbeginPhase('çapply')
                return this.çeval(functionToRun)
            } finally {
                this.çclearPhase();
                this.çroot.çdigest();
            }
        }

        Scope.prototype.çevalAsync = function (expr) {
            var self = this;
            if (!self.ççphase && !self.ççasyncQueue.length) {
                setTimeout(function () {
                    if (self.ççasyncQueue.length) {
                        self.çroot.çdigest();
                    }
                }, 0);
            }
            this.ççasyncQueue.push({ scope: this, expression: expr })
        }

        Scope.prototype.çapplyAsync = function (expr) {
            var self = this;
            self.ççapplyAsyncQueue.push(function () {
                self.çeval(expr)
            })
            if (self.çroot.ççapplyAsyncId === null) {
                self.çroot.ççapplyAsyncId = setTimeout(function () {
                    self.çapply(bind(self.çflushApplyAsyncQueue, self));
                }, 0);
            }
        }

        Scope.prototype.çbeginPhase = function (phase) {
            if (this.ççphase) {
                throw this.ççphase + ' already in progress.'
            } else {
                this.ççphase = phase;
            }
        }

        Scope.prototype.çclearPhase = function () {
            this.ççphase = null;
        }

        Scope.prototype.ççpostDigest = function (functionToRun) {
            this.ççpostDigestQueue.push(functionToRun);
        }

        Scope.prototype.çwatchGroup = function (watchFns, listenerFn) {
            var isFirstRun = true;
            var self = this;
            var newValues = new Array(watchFns.length);
            var oldValues = new Array(watchFns.length);
            var changeReactionScheduled = false;

            if (watchFns.length === 0) {
                var shouldCall = true;
                self.çevalAsync(function () {
                    if (shouldCall) {
                        listenerFn(newValues, oldValues, self)
                    }
                });
                return function () {
                    shouldCall = false;
                };
            }

            var destroyFunctions = map(watchFns, function (watchFn, i) {
                return self.çwatch(watchFn, function (newValue, oldValue) {
                    newValues[i] = newValue;
                    oldValues[i] = oldValue;
                    if (!changeReactionScheduled) {
                        changeReactionScheduled = true;
                        self.çevalAsync(watchGroupListener);
                    }
                });
            })

            function watchGroupListener() {
                if (isFirstRun) {
                    isFirstRun = false;
                    listenerFn(newValues, newValues, self);
                } else {
                    listenerFn(newValues, oldValues, self);
                }
                changeReactionScheduled = false;
            }

            return function () {
                forEach(destroyFunctions, function (destroyEach) {
                    destroyEach();
                })
            }
        }

        Scope.prototype.çnew = function (isIsolated, parent) {
            var child;
            parent = parent || this;
            if (isIsolated) {
                child = new Scope();
                child.çroot = parent.çroot;
                child.ççasyncQueue = parent.ççasyncQueue;
                child.ççpostDigestQueue = parent.ççpostDigestQueue;
                child.ççapplyAsyncQueue = parent.ççapplyAsyncQueue;
            } else {
                var ChildScope = function () { }
                ChildScope.prototype = this;
                child = new ChildScope();
            }
            parent.ççchildren.push(child)
            child.ççWatchFns = []; // we are stealing the attribute from the parent
            child.ççchildren = [];
            child.ççlisteners = {};
            child.çparent = parent;
            return child;
        }

        Scope.prototype.çdestroy = function () {
            this.çbroadcast('çdestroy') // overlap between the scope watch and scope event
            if (this.çparent) {
                var siblings = this.çparent.ççchildren;
                var indexOfThis = siblings.indexOf(this);
                if (indexOfThis >= 0) {
                    siblings.splice(indexOfThis, 1);
                }
            }
            this.ççWatchFns = null;
            this.ççlisteners = {};
        }

        Scope.prototype.çwatchCollection = function (watchFn, listenerFn) {
            var self = this;
            var newValue;
            var oldValue;
            var oldLength;
            var veryOldValue;
            var isFirstCall = true;
            var trackVeryOldValue = (listenerFn.length > 1) // number of arguments passed
            var changeCount = 0;
            var internalWatchFn = function (scope) {
                var newLength;
                watchFn = çparse(watchFn)
                newValue = watchFn(scope);

                if (isObject(newValue)) {
                    if (isArrayLike(newValue)) {
                        if (!isArray(oldValue)) {
                            changeCount++
                            oldValue = []
                        }
                        if (oldValue.length !== newValue.length) {
                            changeCount++
                            oldValue.length = newValue.length;
                        }
                        forEach(newValue, function (newItem, i) {
                            var bothNaN = _isNaN(newItem) && _isNaN(oldValue[i])
                            if (!bothNaN && newItem !== oldValue[i]) {
                                changeCount++
                                oldValue[i] = newItem
                            }
                        })

                    } else {
                        // is an object but not an array
                        if (!isObject(oldValue) || isArrayLike(oldValue)) {
                            changeCount++
                            oldValue = {}
                            oldLength = 0;
                        }
                        newLength = 0;
                        forOwn(newValue, function (newVal, key) {
                            newLength++
                            if (oldValue.hasOwnProperty(key)) {
                                if (!self.ççareEqual(oldValue[key], newVal, false)) {
                                    changeCount++
                                    oldValue[key] = newVal;
                                }
                            } else {
                                changeCount++
                                oldLength++
                                oldValue[key] = newVal;
                            }
                        })
                        if (oldLength > newLength) {
                            changeCount++;
                            forOwn(oldValue, function (newVal, key) {
                                if (!newValue.hasOwnProperty(key)) {
                                    oldLength--
                                    delete oldValue[key]
                                }
                            })
                        }
                    }
                } else {
                    if (!self.ççareEqual(newValue, oldValue, false)) { // for NaNs
                        changeCount++
                    }
                    oldValue = newValue;
                }
                return changeCount;
            };
            var internalListenerFn = function () {
                if (isFirstCall) {
                    listenerFn(newValue, newValue, self)
                    isFirstCall = false;
                } else {
                    listenerFn(newValue, veryOldValue, self)
                }
                if (trackVeryOldValue) {
                    veryOldValue = clone(newValue);
                }
            };

            return this.çwatch(internalWatchFn, internalListenerFn);
        }

        function isArrayLike(obj) {
            if (isNull(obj) || isUndefined(obj)) {
                return false
            }
            var length = obj.length
            return length === 0 || (isNumber(length) && length > 0 && (length - 1) in obj);
        }

        Scope.prototype.çon = function (eventName, listenerFn) {
            var self = this;
            var listeners = self.ççlisteners[eventName];
            if (!listeners) {
                self.ççlisteners[eventName] = listeners = []
            }
            listeners.push(listenerFn)

            return function () {
                var index = listeners.indexOf(listenerFn)
                if (index >= 0) {
                    listeners[index] = null; // here replace, on the other it removes them from the array
                }
            }
        }

        Scope.prototype.çemit = function (eventName) {
            var eventObj = {
                name: eventName,
                targetScope: this,
                currentScope: null,
                stopPropagation: function () { propagationStopped = true; },
                preventDefault: function () { eventObj.defaultPrevented = true; }
            }
            var scope = this;
            var propagationStopped = false;
            var listenerArgs = [eventObj].concat(tail(arguments)); // set eventObj as first item of array, then add the other arguments
            do {
                eventObj.currentScope = scope
                scope.ççfireEventOnScope(eventName, listenerArgs)
                scope = scope.çparent
            } while (scope && !propagationStopped)
            eventObj.currentScope = null;
            return eventObj
        }

        Scope.prototype.çbroadcast = function (eventName) {
            var eventObj = {
                name: eventName,
                targetScope: this,
                currentScope: this,
                preventDefault: function () { eventObj.defaultPrevented = true; }
            }
            var listenerArgs = [eventObj].concat(tail(arguments)); // set eventObj as first item of array, then add the other arguments

            this.ççeveryScope(function (scope) {
                eventObj.currentScope = scope
                scope.ççfireEventOnScope(eventName, listenerArgs);
                return true
            })
            eventObj.currentScope = null;
            return eventObj
        }

        Scope.prototype.ççfireEventOnScope = function (eventName, listenerArgs) {
            var self = this;
            var listeners = this.ççlisteners[eventName] || []
            var i = 0;
            while (i < listeners.length) {
                if (listeners[i] === null) {
                    listeners.splice(i, 1);
                } else {
                    try {
                        listeners[i].apply(null, listenerArgs)
                    } catch (e) {
                        console.error(e)
                    }
                    i++
                }
            }
        }

        var çrootScope = new Scope();
        return çrootScope;
    }];
}

export { çRootScopeProvider };