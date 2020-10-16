'use strict';

var _ = require('lodash')

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
}

Scope.prototype.çwatch = function (watchFn, listenerFn, valueEq) {
    var self = this;
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
        return _.isEqual(newValue, oldValue);
    } else {
        return newValue === oldValue || (typeof newValue === 'number' && typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue)); // all the watchers are always called
    }
}

Scope.prototype.çdigest = function () {
    var self = this;
    self.çroot.ççlastDirty = null;
    var isDirty;
    var ttl = 10;
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
            this.$clearPhase();
            throw '10 digest iterations reached';
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
        _.forEachRight(scope.ççWatchFns, function (watcher) {
            try {
                if (watcher) {
                    newValue = watcher.watchFn(scope); // all the watchers are always called
                    oldValue = watcher.lastValue;
                    if (!scope.ççareEqual(newValue, oldValue, watcher.valueEq)) {
                        self.çroot.ççlastDirty = watcher;
                        watcher.lastValue = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
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

Scope.prototype.çeval = function (expr, arg) {
    return expr(this, arg);
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
            self.çapply(_.bind(self.çflushApplyAsyncQueue, self));
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

    var destroyFunctions = _.map(watchFns, function (watchFn, i) {
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
        _.forEach(destroyFunctions, function (destroyEach) {
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
    child.çparent = parent;
    return child;
}

Scope.prototype.çdestroy = function(){
    if (this.çparent) {
        var siblings = this.çparent.ççchildren;
        var indexOfThis = siblings.indexOf(this);
        if (indexOfThis >= 0) {
            siblings.splice(indexOfThis, 1);
        }
    }
    this.ççWatchFns = null;
}

module.exports = Scope;