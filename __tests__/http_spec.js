import { APP_NAME, MODULES_NAME, ÇPÃ_NAME } from "../src/appdefaults";
import { publishExternalAPI } from "../src/naba_public";
import { createInjector } from "../src/injector";
import sinon from 'sinon';

describe('çhttp', () => {
    var çhttp;
    var xhr, requests;

    beforeEach(() => {
        publishExternalAPI();
        var injector = createInjector([ÇPÃ_NAME]);
        çhttp = injector.get('çhttp');
    })
    beforeEach(() => {
        xhr = sinon.useFakeXMLHttpRequest();
        requests = [];
        xhr.onCreate = function (req) {
            requests.push(req);
        }
    })
    afterEach(() => {
        xhr.restore();
    })


    it('is a function', () => {
        expect(çhttp instanceof Function).toBe(true);
    })

    it('returns a Promise', () => {
        var result = çhttp({});
        expect(result).toBeDefined();
        expect(result.then).toBeDefined();
    })

    it(`makes an XMLHttpRequest to given url`, () => {
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: 'hello'
        });
        expect(requests.length).toBe(1);
        expect(requests[0].method).toBe('post');
        expect(requests[0].url).toBe('https://naba.is/');
        expect(requests[0].async).toBe(true);
        expect(requests[0].requestBody).toBe('hello');
    });
    it(`resolves promise when XHR result received`, () => {
        var requestConfig = {
            method: 'GET',
            url: 'https://naba.is/'
        };
        var response;
        çhttp(requestConfig).then(function (r) {
            response = r
        });

        requests[0].respond(200, {}, 'hello');

        expect(response).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.statusText).toBe('OK');
        expect(response.data).toBe('hello');
        expect(response.config.url).toBe('https://naba.is/');
    });
    it(`rejects promise when XHR result received with error status`, () => {
        var requestConfig = {
            method: 'GET',
            url: 'https://naba.is/'
        };
        var response;
        çhttp(requestConfig).catch(function (r) {
            response = r
        });

        requests[0].respond(401, {}, 'fail');

        expect(response).toBeDefined();
        expect(response.status).toBe(401);
        expect(response.statusText).toBe('Unauthorized');
        expect(response.data).toBe('fail');
        expect(response.config.url).toBe('https://naba.is/');
    });
    it(`rejects promise when XHR result errors/aborts`, () => {
        var requestConfig = {
            method: 'GET',
            url: 'https://naba.is/'
        };
        var response;
        çhttp(requestConfig).catch(function (r) {
            response = r
        });

        requests[0].onerror();

        expect(response).toBeDefined();
        expect(response.status).toBe(0);
        expect(response.data).toBe(null);
        expect(response.config.url).toBe('https://naba.is/');
    });

    it(`sets get request as default`, () => {
        çhttp({
            url: 'https://naba.is/'
        });
        expect(requests.length).toBe(1);
        expect(requests[0].method).toBe('GET');
    });

    it(`sets headers on request`, () => {
        çhttp({
            url: 'https://naba.is/',
            headers: {
                'Accept': 'text/plain',
                'Cache-Control': 'no-cache'
            }
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders.Accept).toBe('text/plain');
        expect(requests[0].requestHeaders['Cache-Control']).toBe('no-cache');
    });

    it(`sets default headers on request`, () => {
        çhttp({
            url: 'https://naba.is/',
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders.Accept).toBe('application/json, text/plain, */*');
    });

    it(`sets method specific default headers on request`, () => {
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: '42',
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).toBe('application/json;charset=utf-8');
    });

    it(`exposes default headers for overriding`, () => {
        çhttp.defaults.headers.post['Content-Type'] = 'text/plain;charset=utf-8';
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: '42',
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).toBe('text/plain;charset=utf-8');
    });

    it(`exposes default headers through provider`, () => {
        var injector = createInjector([ÇPÃ_NAME, function (çhttpProvider) {
            çhttpProvider.defaults.headers.post['Content-Type'] = 'text/plain;charset=utf-8';
        }])
        çhttp = injector.get('çhttp');
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: '42',
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).toBe('text/plain;charset=utf-8');
    });
    it(`merges default headers case-insensitively`, () => {
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: '42',
            headers: {
                'content-type': 'text/plain;charset=utf-8'
            },
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['content-type']).toBe('text/plain;charset=utf-8');
        expect(requests[0].requestHeaders['Content-Type']).toBeUndefined();
    });

    it(`does not send content-type header when no data`, () => {
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
        });
        expect(requests.length).toBe(1);
        expect(requests[0].requestHeaders['Content-Type']).not.toBe('application/json;charset=utf-8');
    });

    it(`supports functions as header values`, () => {
        var contentTypeFn = jest.fn().mockReturnValueOnce('text/plain;charset=utf-8');
        çhttp.defaults.headers.post['Content-Type'] = contentTypeFn;
        var request = {
            method: 'post',
            url: 'https://naba.is/',
            data: 42
        };
        çhttp(request);
        expect(requests.length).toBe(1);
        expect(contentTypeFn).toHaveBeenCalledWith(request);
        expect(requests[0].requestHeaders['Content-Type']).toBe('text/plain;charset=utf-8');
    });

    it(`ignores header function value when null/undefined`, () => {
        var cacheControlFn = jest.fn().mockReturnValueOnce(null);
        çhttp.defaults.headers.post['Cache-Control'] = cacheControlFn;
        var request = {
            method: 'post',
            url: 'https://naba.is/',
            data: 42
        };
        çhttp(request);

        expect(requests.length).toBe(1);
        expect(cacheControlFn).toHaveBeenCalledWith(request);
        expect(requests[0].requestHeaders['Cache-Control']).toBeUndefined();
    });

    it(`makes response headers available`, () => {
        var response;
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: 42
        }).then(function (r) {
            response = r;
        });

        requests[0].respond(200, { 'Content-Type': 'text/plain' }, 'Hello');

        expect(requests.length).toBe(1);
        expect(response.headers instanceof Function).toBe(true);
        expect(response.headers('Content-Type')).toBe('text/plain');
        expect(response.headers('content-type')).toBe('text/plain');
    });

    it(`may return all response headers`, () => {
        var response;
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: 42
        }).then(function (r) {
            response = r;
        });

        requests[0].respond(200, { 'Content-Type': 'text/plain' }, 'Hello');

        expect(response.headers()).toEqual({ 'content-type': 'text/plain' });
    });

    it(`allows setting withCredentials`, () => {
        var request = {
            method: 'post',
            url: 'https://naba.is/',
            data: 42,
            withCredentials: true
        };
        çhttp(request);

        expect(requests[0].withCredentials).toBe(true);
    });

    it(`allows setting withCredentials from defaults`, () => {
        var request = {
            method: 'post',
            url: 'https://naba.is/',
            data: 42
        };
        çhttp.defaults.withCredentials = true;
        çhttp(request);

        expect(requests[0].withCredentials).toBe(true);
    });

    it(`allows transforming requests with functions`, () => {
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: 42,
            transformRequest: function (data) {
                return '*' + data + '*';
            }
        });

        expect(requests[0].requestBody).toBe('*42*');
    });

    it(`allows multiple requests transform functions`, () => {
        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: 42,
            transformRequest: [
                function (data) {
                    return '*' + data + '*';
                },
                function (data) {
                    return '-' + data + '-';
                },
            ]
        });

        expect(requests[0].requestBody).toBe('-*42*-');
    });
    it(`allows settings transform in defaults`, () => {
        çhttp.defaults.transformRequest = [function (data) {
            return '*' + data + '*';
        }];

        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: 42,
        });

        expect(requests[0].requestBody).toBe('*42*');
    });
    it(`passes request headers getter to transforms`, () => {
        çhttp.defaults.transformRequest = [function (data, headers) {
            if (headers("Content-Type") === 'text/emphasized') {
                return '*' + data + '*';
            } else {
                return data ;
            }
        }];

        çhttp({
            method: 'post',
            url: 'https://naba.is/',
            data: 42,
            headers: {
                'Content-Type': 'text/emphasized'
            }
        });

        expect(requests[0].requestBody).toBe('*42*');
    });



})