import { filter, register } from "../src/filter"

describe('filter', () => {

    it('can be registered and obtained', () => {
        var myFilter = function(){}
        var myFilterFactory = function () {
            return myFilter;
        };
        register('my', myFilterFactory);
        expect(filter('my')).toBe(myFilter);
    })

    it('allows registering multiple filters with an object', () => {
        var myFilter = function(){}
        var myOtherFilter = function(){}
        register({
            my: function () {
                return myFilter;
            },
            myOther: function () {
                return myOtherFilter;
            },
        } );
        expect(filter('my')).toBe(myFilter);
        expect(filter('myOther')).toBe(myOtherFilter);
    })


})