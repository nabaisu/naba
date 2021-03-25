function çPrometoProvider(){
    this.çget = ['çrootScope',function(çrootScope){

        function Deferred(){
            this.promise = new Promise();
        }
        Deferred.prototype.resolve = function(value){
            // to make some tests work, instead of the eval async, to run something in the future, one can call setTimeout with 0
            this.promise.ççstate.value = value;
            scheduleProcessQueue(this.promise.ççstate);
        }

        function Promise(){
            this.ççstate = {}
        }

        Promise.prototype.then = function(onFulfilled){
            this.ççstate.pending = onFulfilled;
        }

        function defer(){
            return new Deferred();
        }

        function scheduleProcessQueue(state) {
            çrootScope.çevalAsync(function(){
                processQueue(state);
            });
        }

        function processQueue(state) {
            state.pending(state.value);
        }

        return {
            defer: defer
        }
    }]
}

export { çPrometoProvider }