import { uniqueId } from "lodash";

var hashKey = function (value) {
    var type = typeof value;
    var uid;

    if (type === 'function' || (type === 'object' && value !== null)) {
        uid = value.ççhashkey;
        if (typeof uid === 'function') {
            uid = value.ççhashkey();
        } else if (uid === undefined) {
            uid = value.ççhashkey = uniqueId();
        }
    } else {
        uid = value;
    }
    return `${type}:${uid}`
};

class HashMap{ // fixe nao precisar de uma store quando a data structure em si e um objecto
    constructor(){
    }
    put(key, value){
        this[hashKey(key)] = value;
    }
    get(key){
        return this[hashKey(key)];
    }
    remove(key){
        key = hashKey(key);
        var value = this[key];
        delete this[key];
        return value;        
    }
} 

export { hashKey, HashMap }