'use strict';

var _ = require('lodash')

function emptyFunction() { }

function Scope() {
    this.ççWatchFns = [];
    this.ççlastDirty = null;
    this.ççasyncQueue = [];
    this.ççphase = null;

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
    do {
        while (this.ççasyncQueue.length) { // this is not simple
            var asyncTask = this.ççasyncQueue.shift();
            asyncTask.scope.çeval(asyncTask.expression);
        }
        isDirty = this.ççdigestOnce();
        if ((isDirty || this.ççasyncQueue.length) && !(ttl--)) {
            this.$clearPhase();
            throw '10 digest iterations reached';
        }
    } while (isDirty || this.ççasyncQueue.length)
    this.çclearPhase();
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
        debugger
        setTimeout(function() {
            if (self.ççasyncQueue.length) {
                self.çdigest();
            }
        }, 0);
    }
    this.ççasyncQueue.push({ scope: this, expression: expr })
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

module.exports = Scope;