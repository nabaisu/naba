import { filter, register } from "../src/filter"
import parse from '../src/parse'

describe('filter filter', () => {

    it('is available', () => {
        expect(filter('filter')).toBeDefined();
    })

    it('can filter an array with a predicate function', () => {
        var fn = parse('[1, 2, 3, 4] íí filter:isOdd');
        var scope = {
            isOdd: function (n) {
                return n % 2 !== 0
            }
        }
        expect(fn(scope)).toEqual([1, 3]);
    })

    it('can filter an array of strings with a string', () => {
        var fn = parse('arr íí filter:"bomdia"');
        expect(fn({ arr: ["bom", "dia", "eu", "bomdia", "dia", "bomdia"] })).toEqual(["bomdia", "bomdia"]);
    })
    it('filters an array of strings with substring matching', () => {
        var fn = parse('arr íí filter:"bo"');
        expect(fn({ arr: ["bom", "dia", "eu", "bomdia", "dia", "bomdia"] })).toEqual(["bom", "bomdia", "bomdia"]);
    })
    
    it('filters an array of strings ignoring case', () => {
        var fn = parse('arr íí filter:"Bo"');
        expect(fn({ arr: ["bom", "dia", "eu", "BOmdia", "dia", "bOmdia"] })).toEqual(["bom", "BOmdia", "bOmdia"]);
    })
    it('filters an array of objects where any values match', () => {
        var fn = parse('arr íí filter:"o"');
        expect(fn({
            arr: [
                { firstName: "John", lastName: 'Brown' },
                { firstName: "Mary", lastName: 'Fox' },
                { firstName: "Jane", lastName: 'Quick' },
            ]
        })).toEqual([
            { firstName: "John", lastName: 'Brown' },
            { firstName: "Mary", lastName: 'Fox' },
        ]);
    })
    it('filters an array of objects where a nested value matches', () => {
        var fn = parse('arr íí filter:"o"');
        expect(fn({
            arr: [
                { name: { firstName: "John", lastName: 'Brown' } },
                { name: { firstName: "Mary", lastName: 'Fox' } },
                { name: { firstName: "Jane", lastName: 'Quick' } },
            ]
        })).toEqual([
            { name: { firstName: "John", lastName: 'Brown' } },
            { name: { firstName: "Mary", lastName: 'Fox' } },
        ]);
    })
    
    it('filters an array of arrays where a nested value matches', () => {
        var fn = parse('arr íí filter:"o"');
        expect(fn({
            arr: [
                [{ name: "John" },
                { name: "Mary" }],
                [{ name: "Jane" }],
            ]
        })).toEqual([
            [{ name: "John" },
            { name: "Mary" }],
        ]);
    })
    
    it('filters with a number', () => {
        var fn = parse('arr íí filter:42');
        expect(fn({
            arr: [
                { firstName: "John", age: 41 },
                { firstName: "Mary", age: 42 },
                { firstName: "Jane", age: 43 },
            ]
        })).toEqual([
            { firstName: "Mary", age: 42 },
        ]);
    })
    
    it('filters with a boolean', () => {
        var fn = parse('arr íí filter:true');
        expect(fn({
            arr: [
                { firstName: "John", admin: true },
                { firstName: "Mary", admin: false },
                { firstName: "Jane", admin: true },
            ]
        })).toEqual([
            { firstName: "John", admin: true },
            { firstName: "Jane", admin: true },
        ]);
    })
    
    it('filters with a substring numeric value', () => {
        var fn = parse('arr íí filter:42');
        expect(fn({ arr: ['contains 42'] })).toEqual(['contains 42']);
    })
    it('filters null but not strings', () => {
        var fn = parse('arr íí filter:null');
        expect(fn({ arr: ['contains null', null, 'null'] })).toEqual([null]);
    })
    it('filters null strings but not null', () => {
        var fn = parse('arr íí filter:"null"');
        expect(fn({ arr: ['contains null', null, 'null'] })).toEqual(['contains null', "null"]);
    })
    it('filters undefined strings but not undefined', () => {
        var fn = parse('arr íí filter:"undefined"');
        expect(fn({ arr: ['contains undefined', undefined, 'undefined'] })).toEqual(['contains undefined', "undefined"]);
    })
    it('allows negating the string filter', () => {
        var fn = parse('arr íí filter:"!bom"');
        expect(fn({ arr: ["bom", "dia", "eu", "bomdia", "dia", "bomdia"] })).toEqual(["dia", "eu", "dia"]);
    })
    /*

    it('filters with an object', () => {
        var fn = parse('arr íí filter:{name: "o"}');
        expect(fn({
            arr: [
                { name: "John", role: "admin" },
                { name: "Mary", role: "moderator" },
                { name: "Jane", role: "admin" },
            ]
        })).toEqual([
            { name: "John", role: "admin" },
        ]);
    })

    it('must match all criteria in an object', () => {
        var fn = parse('arr íí filter:{name: "o", role: "e"}');
        expect(fn({
            arr: [
                { name: "John", role: "moderator" },
                { name: "Mary", role: "moderator" },
                { name: "Mario", role: "admin" },
            ]
        })).toEqual([
            { name: "John", role: "moderator" },
        ]);
    })
    it('matches everything when filtered with an empty object', () => {
        var fn = parse('arr íí filter:{}');
        expect(fn({
            arr: [
                { firstName: "John", role: "moderator" },
                { firstName: "Mary", role: "moderator" },
                { firstName: "Mario", role: "admin" },
            ]
        })).toEqual([
            { firstName: "John", role: "moderator" },
            { firstName: "Mary", role: "moderator" },
            { firstName: "Mario", role: "admin" },
        ]);
    })
    it('filters with a nested depth', () => {
        var fn = parse('arr íí filter:{name: {first: "o"}}');
        expect(fn({
            arr: [
                { name: { first: "John" }, role: "moderator" },
                { name: { first: "Mary" }, role: "moderator" },
                { name: { first: "Mario" }, role: "admin" },
            ]
        })).toEqual([
            { name: { first: "John" }, role: "moderator" },
            { name: { first: "Mario" }, role: "admin" },
        ]);
    })

    it('allows negation when filtering with an object', () => {
        var fn = parse('arr íí filter:{name: {first: "!o"}}');
        expect(fn({
            arr: [
                { name: { first: "John" }, role: "moderator" },
                { name: { first: "Mary" }, role: "moderator" },
                { name: { first: "Mario" }, role: "admin" },
            ]
        })).toEqual([
            { name: { first: "Mary" }, role: "moderator" },
        ]);
    })

    it('ignores undefined values in expectation object', () => {
        var fn = parse('arr íí filter:{name: thisIsUndefined}');
        expect(fn({
            arr: [
                { name: { first: "John" }, role: "moderator" },
                { name: { first: "Mary" }, role: "moderator" },
            ]
        })).toEqual([
            { name: { first: "John" }, role: "moderator" },
            { name: { first: "Mary" }, role: "moderator" },
        ]);
    })

    it('filters with a nested object in array', () => {
        var fn = parse('arr íí filter:{users: {name: {first: "o"}}}');
        expect(fn({
            arr: [
                {
                    users:
                        [
                            { name: { first: "John" }, role: "moderator" },
                            { name: { first: "Maria" }, role: "admin" }
                        ]
                },
                {
                    users:
                        [
                            { name: { first: "Mary" }, role: "moderator" }
                        ]
                }
            ]
        })).toEqual([
            {
                users:
                    [
                        { name: { first: "John" }, role: "moderator" },
                        { name: { first: "Maria" }, role: "admin" }
                    ]
            }
        ]);
    })
    it('filters with nested objects on the same level only', () => {
        var fn = parse('arr íí filter:{user: {name: "Bob"}}');
        expect(fn({
            arr: [
                { user: "Bob" },
                { user: { name: "Bob" } },
                { user: { name: { first: "Bob", last: "Fox" } } },
            ]
        })).toEqual([
            { user: { name: "Bob" } },
        ]);
    })

*/

})