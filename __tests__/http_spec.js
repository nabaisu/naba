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

})