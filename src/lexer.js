export default class Lexer {
    constructor() {
        this.numberRegex = /[0-9]/;
        this.stringRegex = /[\"\']/;
        this.identRegex = /[a-zA-Z_\$ç]/;
        this.whitespaceRegex = /[ \n\r\t\v\u00A0]/;
        this.arrayObjectFnAssignmentRegex = /[\[\],\{\}:.\(\)\?\;]/;
        this.OPERATORS = {
            '+': true,
            '-': true,
            '!': true,
            '*': true,
            '/': true,
            '%': true,
            '===': true,
            '!==': true,
            '==': true,
            '!=': true,
            '=': true,
            '<': true,
            '<=': true,
            '>': true,
            '>=': true,
            '||': true,
            '&&': true,
            '(': true,
            ')': true,
        }
    }

    // from: '42'
    // to:   {text: '42', value: 42}
    lex(text) {
        this.text = text
        this.index = 0;
        this.ch;
        this.tokens = [];

        while (this.index < this.text.length) {
            this.ch = this.text.charAt(this.index);
            if (this.isNumber(this.ch) || (this.ch === '.' && this.isNumber(this.peek()))) {
                this.readNumber();
            } else if (this.isString(this.ch)) {
                this.readString(this.ch);
            } else if (this.isIdent(this.ch)) {
                this.readIdent();
            } else if (this.isWhitespace(this.ch)) {
                this.index++;
            } else if (this.isArrayObjectFnAssignmentRegex(this.ch)) {
                this.tokens.push({
                    text: this.ch
                });
                this.index++
            } else {
                var ch = this.ch;  // =
                var ch2 = this.ch + this.peek(); // == 
                var ch3 = this.ch + this.peek() + this.peek(2); // === 
                var op = this.OPERATORS[ch];
                var op2 = this.OPERATORS[ch2];
                var op3 = this.OPERATORS[ch3];
                if (op || op2 || op3) {
                    var token = op3 ? ch3 : (op2 ? ch2 : ch);
                    this.tokens.push({ text: token });
                    this.index += token.length;
                } else {
                    throw `unexpected next character: ${this.ch}`
                }
            }
        }

        return this.tokens;
    }

    isNumber(char) {
        return char.match(this.numberRegex);
    }
    isString(char) {
        return char.match(this.stringRegex);
    }
    isIdent(char) {
        return char.match(this.identRegex);
    }
    isWhitespace(char) {
        return char.match(this.whitespaceRegex);
    }
    isArrayObjectFnAssignmentRegex(char) {
        return char.match(this.arrayObjectFnAssignmentRegex);
    }
    isUnary(char) {
        return char.match(this.unaryRegex);
    }

    readNumber() {
        var number = '';
        while (this.index < this.text.length) {
            var ch = this.text.charAt(this.index).toLowerCase();
            if (ch === '.' || this.isNumber(ch)) {
                number += ch;
            } else {
                if (ch === 'e' && this.occurencesOf(number, 'e') > 0) { // this means it's the second 'e'
                    throw 'you have 2 exponents in the number'
                }
                var nextCh = this.peek();
                var prevCh = number.charAt(number.length - 1);
                if (ch === 'e' && this.isExpOperator(nextCh)) {
                    number += ch;
                } else if (this.isExpOperator(ch) && prevCh === 'e' && nextCh && this.isNumber(nextCh)) {
                    number += ch;
                } else if (this.isExpOperator(ch) && prevCh === 'e' && (!nextCh || !this.isNumber(nextCh))) {
                    throw 'invalid exponent';
                } else {
                    break;
                }
            }
            this.index++
        }
        this.tokens.push({
            text: number,
            value: Number(number)
        });
    }

    readString(startingQuote) {
        var ESCAPES = {
            'n': '\n', 'f': '\f', 'r': '\r',
            't': '\t', 'v': '\v', '\'': '\'', '\"': '\"'
        }
        var escape = false;
        this.index++;
        var rawString = startingQuote;
        var string = '';
        while (this.index < this.text.length) {
            var ch = this.text.charAt(this.index);
            rawString += ch;
            if (escape) {
                if (ch === 'u') {
                    var hex = this.text.substring(this.index + 1, this.index + 5);
                    if (!hex.match(/[\da-f]{4}/i)) {
                        throw 'invalid unicode escape'
                    }
                    this.index += 4;
                    string += String.fromCharCode(parseInt(hex, 16));
                } else {
                    var replacement = ESCAPES[ch];
                    string += (replacement) ? replacement : ch;
                }
                escape = false;
            } else if (ch === startingQuote) {
                // here is not going yet
                this.index++;
                this.tokens.push({
                    text: rawString,
                    value: string
                });
                return;
            } else if (ch === '\\') {
                escape = true;
            } else {
                string += ch
            }
            this.index++
        }
        throw 'unmatched quote'
    }

    readIdent() {
        var text = '';
        while (this.index < this.text.length) {
            var ch = this.text.charAt(this.index);
            if (this.isIdent(ch) || this.isNumber(ch)) {
                text += ch;
            } else {
                break;
            }
            this.index++
        }
        var token = { text: text, identifier: true };
        this.tokens.push(token);
    }

    isExpOperator(ch) {
        return ch === '-' || ch === '+' || this.isNumber(ch);
    }

    peek(n) {
        n = n || 1;
        return this.index + n < this.text.length ?
            this.text.charAt(this.index + n) :
            false
    }

    occurencesOf(stringToSearch, whatToFind) {
        var regEx = new RegExp(whatToFind, 'g');
        return (stringToSearch.match(regEx) || []).length
    }

}