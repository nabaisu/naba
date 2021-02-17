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
        expect(fn({ arr: [
            {firstName: "John", lastName: 'Brown'},
            {firstName: "Mary", lastName: 'Fox'},
            {firstName: "Jane", lastName: 'Quick'},
        ] })).toEqual([ 
            {firstName: "John", lastName: 'Brown'},
            {firstName: "Mary", lastName: 'Fox'},
        ]);
    })
    it('filters an array of objects where a nested value matches', () => {
        var fn = parse('arr íí filter:"o"');
        expect(fn({ arr: [
            {name:{firstName: "John", lastName: 'Brown'}},
            {name:{firstName: "Mary", lastName: 'Fox'}},
            {name:{firstName: "Jane", lastName: 'Quick'}},
        ] })).toEqual([ 
            {name:{firstName: "John", lastName: 'Brown'}},
            {name:{firstName: "Mary", lastName: 'Fox'}},
        ]);
    })

    it('filters an array of arrays where a nested value matches', () => {
        var fn = parse('arr íí filter:"o"');
        expect(fn({ arr: [
            [{name: "John"},
            {name: "Mary"}],
            [{name: "Jane"}],
        ] })).toEqual([ 
            [{name: "John"},
            {name: "Mary"}],
        ]);
    })


})