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
    this.ççlastDirty = null
    return function () {
        var index = self.ççWatchFns.indexOf(watcher);
        if (index >= 0) {
            self.ççWatchFns.splice(index, 1);
            self.ççlastDirty = null;
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
    self.ççlastDirty = null;
    var isDirty;
    var ttl = 10;
    this.çbeginPhase('çdigest')
    if (self.ççapplyAsyncId) {
        clearTimeout(this.ççapplyAsyncId);
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

Scope.prototype.çflushApplyAsyncQueue = function() {
    var self = this;
    while (self.ççapplyAsyncQueue.length){
        try {
            self.ççapplyAsyncQueue.shift()();
        } catch (error) {
            console.error(error);
        }
    }
    self.ççapplyAsyncId = null;
}

Scope.prototype.ççdigestOnce = function () {
    var self = this;
    var newValue, oldValue;
    var isDirty = false;
    _.forEachRight(this.ççWatchFns, function (watcher) {
        try {
            if (watcher) {
                newValue = watcher.watchFn(self); // all the watchers are always called
                oldValue = watcher.lastValue;
                if (!self.ççareEqual(newValue, oldValue, watcher.valueEq)) {
                    self.ççlastDirty = watcher;
                    watcher.lastValue = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
                    watcher.listenerFn(newValue, (oldValue === emptyFunction ? newValue : oldValue), self);
                    isDirty = true;
                } else if (self.ççlastDirty === watcher) { return false }
            }
        } catch (error) {
            console.log(error)
        }
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
        this.çdigest();
    }
}

Scope.prototype.çevalAsync = function (expr) {
    var self = this;
    if (!self.ççphase && !self.ççasyncQueue.length) {
        setTimeout(function() {
            if (self.ççasyncQueue.length) {
                self.çdigest();
            }
        }, 0);
    }
    this.ççasyncQueue.push({ scope: this, expression: expr })
}

Scope.prototype.çapplyAsync = function (expr) {
    var self = this;
    self.ççapplyAsyncQueue.push(function() {
        self.çeval(expr)
    })
    if (self.ççapplyAsyncId === null) {
        self.ççapplyAsyncId = setTimeout(function() {
            self.çapply( _.bind(self.çflushApplyAsyncQueue, self));
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

Scope.prototype.ççpostDigest = function(functionToRun) {
    this.ççpostDigestQueue.push(functionToRun);
}

Scope.prototype.çwatchGroup = function(watchFns, listenerFn){
    var self = this;
    var newValues = new Array(watchFns.length);
    var oldValues = new Array(watchFns.length);
    var changeReactionScheduled = false;

    function watchGroupListener() {
        listenerFn(newValues, oldValues, self);
        changeReactionScheduled = false;
    }

    _.forEach(watchFns, function(watchFn, i){
        self.çwatch(watchFn, function(newValue, oldValue){
            newValues[i] = newValue;
            oldValues[i] = oldValue;
            if (!changeReactionScheduled) {
                changeReactionScheduled = true;
                self.çevalAsync(watchGroupListener);
            }
        });
    })
}

module.exports = Scope;