// Generated by typings
// Source: node_modules/@angular/http/src/backends/browser_xhr.d.ts
declare module '~@angular/http/src/backends/browser_xhr' {
/**
 * A backend for http that uses the `XMLHttpRequest` browser API.
 *
 * Take care not to evaluate this in non-browser contexts.
 *
 * @experimental
 */
export class BrowserXhr {
    constructor();
    build(): any;
}
}
declare module '@angular/http/src/backends/browser_xhr' {
export * from '~@angular/http/src/backends/browser_xhr';
}

// Generated by typings
// Source: node_modules/@angular/http/src/backends/browser_jsonp.d.ts
declare module '~@angular/http/src/backends/browser_jsonp' {
export const JSONP_HOME: string;
export class BrowserJsonp {
    build(url: string): any;
    nextRequestID(): string;
    requestCallback(id: string): string;
    exposeConnection(id: string, connection: any): void;
    removeConnection(id: string): void;
    send(node: any): void;
    cleanup(node: any): void;
}
}
declare module '@angular/http/src/backends/browser_jsonp' {
export * from '~@angular/http/src/backends/browser_jsonp';
}

// Generated by typings
// Source: node_modules/@angular/http/src/backends/jsonp_backend.d.ts
declare module '~@angular/http/src/backends/jsonp_backend' {
import { Observable } from 'rxjs/Observable';
import { ResponseOptions } from '~@angular/http/src/base_response_options';
import { ReadyState } from '~@angular/http/src/enums';
import { Connection, ConnectionBackend } from '~@angular/http/src/interfaces';
import { Request } from '~@angular/http/src/static_request';
import { Response } from '~@angular/http/src/static_response';
import { BrowserJsonp } from '~@angular/http/src/backends/browser_jsonp';
/**
 * Abstract base class for an in-flight JSONP request.
 *
 * @experimental
 */
export abstract class JSONPConnection implements Connection {
    /**
     * The {@link ReadyState} of this request.
     */
    readyState: ReadyState;
    /**
     * The outgoing HTTP request.
     */
    request: Request;
    /**
     * An observable that completes with the response, when the request is finished.
     */
    response: Observable<Response>;
    /**
     * Callback called when the JSONP request completes, to notify the application
     * of the new data.
     */
    abstract finished(data?: any): void;
}
export class JSONPConnection_ extends JSONPConnection {
    private _dom;
    private baseResponseOptions;
    private _id;
    private _script;
    private _responseData;
    private _finished;
    constructor(req: Request, _dom: BrowserJsonp, baseResponseOptions?: ResponseOptions);
    finished(data?: any): void;
}
/**
 * A {@link ConnectionBackend} that uses the JSONP strategy of making requests.
 *
 * @experimental
 */
export abstract class JSONPBackend extends ConnectionBackend {
}
export class JSONPBackend_ extends JSONPBackend {
    private _browserJSONP;
    private _baseResponseOptions;
    constructor(_browserJSONP: BrowserJsonp, _baseResponseOptions: ResponseOptions);
    createConnection(request: Request): JSONPConnection;
}
}
declare module '@angular/http/src/backends/jsonp_backend' {
export * from '~@angular/http/src/backends/jsonp_backend';
}

// Generated by typings
// Source: node_modules/@angular/http/src/backends/xhr_backend.d.ts
declare module '~@angular/http/src/backends/xhr_backend' {
import { Observable } from 'rxjs/Observable';
import { ResponseOptions } from '~@angular/http/src/base_response_options';
import { ReadyState } from '~@angular/http/src/enums';
import { Connection, ConnectionBackend, XSRFStrategy } from '~@angular/http/src/interfaces';
import { Request } from '~@angular/http/src/static_request';
import { Response } from '~@angular/http/src/static_response';
import { BrowserXhr } from '~@angular/http/src/backends/browser_xhr';
/**
 * Creates connections using `XMLHttpRequest`. Given a fully-qualified
 * request, an `XHRConnection` will immediately create an `XMLHttpRequest` object and send the
 * request.
 *
 * This class would typically not be created or interacted with directly inside applications, though
 * the {@link MockConnection} may be interacted with in tests.
 *
 * @experimental
 */
export class XHRConnection implements Connection {
    request: Request;
    /**
     * Response {@link EventEmitter} which emits a single {@link Response} value on load event of
     * `XMLHttpRequest`.
     */
    response: Observable<Response>;
    readyState: ReadyState;
    constructor(req: Request, browserXHR: BrowserXhr, baseResponseOptions?: ResponseOptions);
    setDetectedContentType(req: any, _xhr: any): void;
}
/**
 * `XSRFConfiguration` sets up Cross Site Request Forgery (XSRF) protection for the application
 * using a cookie. See {@link https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)}
 * for more information on XSRF.
 *
 * Applications can configure custom cookie and header names by binding an instance of this class
 * with different `cookieName` and `headerName` values. See the main HTTP documentation for more
 * details.
 *
 * @experimental
 */
export class CookieXSRFStrategy implements XSRFStrategy {
    private _cookieName;
    private _headerName;
    constructor(_cookieName?: string, _headerName?: string);
    configureRequest(req: Request): void;
}
/**
 * Creates {@link XHRConnection} instances.
 *
 * This class would typically not be used by end users, but could be
 * overridden if a different backend implementation should be used,
 * such as in a node backend.
 *
 * ### Example
 *
 * ```
 * import {Http, MyNodeBackend, HTTP_PROVIDERS, BaseRequestOptions} from '@angular/http';
 * @Component({
 *   viewProviders: [
 *     HTTP_PROVIDERS,
 *     {provide: Http, useFactory: (backend, options) => {
 *       return new Http(backend, options);
 *     }, deps: [MyNodeBackend, BaseRequestOptions]}]
 * })
 * class MyComponent {
 *   constructor(http:Http) {
 *     http.request('people.json').subscribe(res => this.people = res.json());
 *   }
 * }
 * ```
 * @experimental
 */
export class XHRBackend implements ConnectionBackend {
    private _browserXHR;
    private _baseResponseOptions;
    private _xsrfStrategy;
    constructor(_browserXHR: BrowserXhr, _baseResponseOptions: ResponseOptions, _xsrfStrategy: XSRFStrategy);
    createConnection(request: Request): XHRConnection;
}
}
declare module '@angular/http/src/backends/xhr_backend' {
export * from '~@angular/http/src/backends/xhr_backend';
}

// Generated by typings
// Source: node_modules/@angular/http/src/base_request_options.d.ts
declare module '~@angular/http/src/base_request_options' {
import { RequestMethod, ResponseContentType } from '~@angular/http/src/enums';
import { Headers } from '~@angular/http/src/headers';
import { RequestOptionsArgs } from '~@angular/http/src/interfaces';
import { URLSearchParams } from '~@angular/http/src/url_search_params';
/**
 * Creates a request options object to be optionally provided when instantiating a
 * {@link Request}.
 *
 * This class is based on the `RequestInit` description in the [Fetch
 * Spec](https://fetch.spec.whatwg.org/#requestinit).
 *
 * All values are null by default. Typical defaults can be found in the {@link BaseRequestOptions}
 * class, which sub-classes `RequestOptions`.
 *
 * ### Example ([live demo](http://plnkr.co/edit/7Wvi3lfLq41aQPKlxB4O?p=preview))
 *
 * ```typescript
 * import {RequestOptions, Request, RequestMethod} from '@angular/http';
 *
 * var options = new RequestOptions({
 *   method: RequestMethod.Post,
 *   url: 'https://google.com'
 * });
 * var req = new Request(options);
 * console.log('req.method:', RequestMethod[req.method]); // Post
 * console.log('options.url:', options.url); // https://google.com
 * ```
 *
 * @experimental
 */
export class RequestOptions {
    /**
     * Http method with which to execute a {@link Request}.
     * Acceptable methods are defined in the {@link RequestMethod} enum.
     */
    method: RequestMethod | string;
    /**
     * {@link Headers} to be attached to a {@link Request}.
     */
    headers: Headers;
    /**
     * Body to be used when creating a {@link Request}.
     */
    body: any;
    /**
     * Url with which to perform a {@link Request}.
     */
    url: string;
    /**
     * Search parameters to be included in a {@link Request}.
     */
    search: URLSearchParams;
    /**
     * Enable use credentials for a {@link Request}.
     */
    withCredentials: boolean;
    responseType: ResponseContentType;
    constructor({method, headers, body, url, search, withCredentials, responseType}?: RequestOptionsArgs);
    /**
     * Creates a copy of the `RequestOptions` instance, using the optional input as values to override
     * existing values. This method will not change the values of the instance on which it is being
     * called.
     *
     * Note that `headers` and `search` will override existing values completely if present in
     * the `options` object. If these values should be merged, it should be done prior to calling
     * `merge` on the `RequestOptions` instance.
     *
     * ### Example ([live demo](http://plnkr.co/edit/6w8XA8YTkDRcPYpdB9dk?p=preview))
     *
     * ```typescript
     * import {RequestOptions, Request, RequestMethod} from '@angular/http';
     *
     * var options = new RequestOptions({
     *   method: RequestMethod.Post
     * });
     * var req = new Request(options.merge({
     *   url: 'https://google.com'
     * }));
     * console.log('req.method:', RequestMethod[req.method]); // Post
     * console.log('options.url:', options.url); // null
     * console.log('req.url:', req.url); // https://google.com
     * ```
     */
    merge(options?: RequestOptionsArgs): RequestOptions;
}
/**
 * Subclass of {@link RequestOptions}, with default values.
 *
 * Default values:
 *  * method: {@link RequestMethod RequestMethod.Get}
 *  * headers: empty {@link Headers} object
 *
 * This class could be extended and bound to the {@link RequestOptions} class
 * when configuring an {@link Injector}, in order to override the default options
 * used by {@link Http} to create and send {@link Request Requests}.
 *
 * ### Example ([live demo](http://plnkr.co/edit/LEKVSx?p=preview))
 *
 * ```typescript
 * import {provide} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {HTTP_PROVIDERS, Http, BaseRequestOptions, RequestOptions} from '@angular/http';
 * import {App} from './myapp';
 *
 * class MyOptions extends BaseRequestOptions {
 *   search: string = 'coreTeam=true';
 * }
 *
 * bootstrap(App, [HTTP_PROVIDERS, {provide: RequestOptions, useClass: MyOptions}]);
 * ```
 *
 * The options could also be extended when manually creating a {@link Request}
 * object.
 *
 * ### Example ([live demo](http://plnkr.co/edit/oyBoEvNtDhOSfi9YxaVb?p=preview))
 *
 * ```
 * import {BaseRequestOptions, Request, RequestMethod} from '@angular/http';
 *
 * var options = new BaseRequestOptions();
 * var req = new Request(options.merge({
 *   method: RequestMethod.Post,
 *   url: 'https://google.com'
 * }));
 * console.log('req.method:', RequestMethod[req.method]); // Post
 * console.log('options.url:', options.url); // null
 * console.log('req.url:', req.url); // https://google.com
 * ```
 *
 * @experimental
 */
export class BaseRequestOptions extends RequestOptions {
    constructor();
}
}
declare module '@angular/http/src/base_request_options' {
export * from '~@angular/http/src/base_request_options';
}

// Generated by typings
// Source: node_modules/@angular/http/src/base_response_options.d.ts
declare module '~@angular/http/src/base_response_options' {
import { Headers } from '~@angular/http/src/headers';
import { ResponseOptionsArgs } from '~@angular/http/src/interfaces';
/**
 * Creates a response options object to be optionally provided when instantiating a
 * {@link Response}.
 *
 * This class is based on the `ResponseInit` description in the [Fetch
 * Spec](https://fetch.spec.whatwg.org/#responseinit).
 *
 * All values are null by default. Typical defaults can be found in the
 * {@link BaseResponseOptions} class, which sub-classes `ResponseOptions`.
 *
 * This class may be used in tests to build {@link Response Responses} for
 * mock responses (see {@link MockBackend}).
 *
 * ### Example ([live demo](http://plnkr.co/edit/P9Jkk8e8cz6NVzbcxEsD?p=preview))
 *
 * ```typescript
 * import {ResponseOptions, Response} from '@angular/http';
 *
 * var options = new ResponseOptions({
 *   body: '{"name":"Jeff"}'
 * });
 * var res = new Response(options);
 *
 * console.log('res.json():', res.json()); // Object {name: "Jeff"}
 * ```
 *
 * @experimental
 */
export class ResponseOptions {
    /**
     * String, Object, ArrayBuffer or Blob representing the body of the {@link Response}.
     */
    body: string | Object | ArrayBuffer | Blob;
    /**
     * Http {@link http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html status code}
     * associated with the response.
     */
    status: number;
    /**
     * Response {@link Headers headers}
     */
    headers: Headers;
    url: string;
    constructor({body, status, headers, statusText, type, url}?: ResponseOptionsArgs);
    /**
     * Creates a copy of the `ResponseOptions` instance, using the optional input as values to
     * override
     * existing values. This method will not change the values of the instance on which it is being
     * called.
     *
     * This may be useful when sharing a base `ResponseOptions` object inside tests,
     * where certain properties may change from test to test.
     *
     * ### Example ([live demo](http://plnkr.co/edit/1lXquqFfgduTFBWjNoRE?p=preview))
     *
     * ```typescript
     * import {ResponseOptions, Response} from '@angular/http';
     *
     * var options = new ResponseOptions({
     *   body: {name: 'Jeff'}
     * });
     * var res = new Response(options.merge({
     *   url: 'https://google.com'
     * }));
     * console.log('options.url:', options.url); // null
     * console.log('res.json():', res.json()); // Object {name: "Jeff"}
     * console.log('res.url:', res.url); // https://google.com
     * ```
     */
    merge(options?: ResponseOptionsArgs): ResponseOptions;
}
/**
 * Subclass of {@link ResponseOptions}, with default values.
 *
 * Default values:
 *  * status: 200
 *  * headers: empty {@link Headers} object
 *
 * This class could be extended and bound to the {@link ResponseOptions} class
 * when configuring an {@link Injector}, in order to override the default options
 * used by {@link Http} to create {@link Response Responses}.
 *
 * ### Example ([live demo](http://plnkr.co/edit/qv8DLT?p=preview))
 *
 * ```typescript
 * import {provide} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {HTTP_PROVIDERS, Headers, Http, BaseResponseOptions, ResponseOptions} from
 * '@angular/http';
 * import {App} from './myapp';
 *
 * class MyOptions extends BaseResponseOptions {
 *   headers:Headers = new Headers({network: 'github'});
 * }
 *
 * bootstrap(App, [HTTP_PROVIDERS, {provide: ResponseOptions, useClass: MyOptions}]);
 * ```
 *
 * The options could also be extended when manually creating a {@link Response}
 * object.
 *
 * ### Example ([live demo](http://plnkr.co/edit/VngosOWiaExEtbstDoix?p=preview))
 *
 * ```
 * import {BaseResponseOptions, Response} from '@angular/http';
 *
 * var options = new BaseResponseOptions();
 * var res = new Response(options.merge({
 *   body: 'Angular',
 *   headers: new Headers({framework: 'angular'})
 * }));
 * console.log('res.headers.get("framework"):', res.headers.get('framework')); // angular
 * console.log('res.text():', res.text()); // Angular;
 * ```
 *
 * @experimental
 */
export class BaseResponseOptions extends ResponseOptions {
    constructor();
}
}
declare module '@angular/http/src/base_response_options' {
export * from '~@angular/http/src/base_response_options';
}

// Generated by typings
// Source: node_modules/@angular/http/src/enums.d.ts
declare module '~@angular/http/src/enums' {
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Supported http methods.
 * @experimental
 */
export enum RequestMethod {
    Get = 0,
    Post = 1,
    Put = 2,
    Delete = 3,
    Options = 4,
    Head = 5,
    Patch = 6,
}
/**
 * All possible states in which a connection can be, based on
 * [States](http://www.w3.org/TR/XMLHttpRequest/#states) from the `XMLHttpRequest` spec, but with an
 * additional "CANCELLED" state.
 * @experimental
 */
export enum ReadyState {
    Unsent = 0,
    Open = 1,
    HeadersReceived = 2,
    Loading = 3,
    Done = 4,
    Cancelled = 5,
}
/**
 * Acceptable response types to be associated with a {@link Response}, based on
 * [ResponseType](https://fetch.spec.whatwg.org/#responsetype) from the Fetch spec.
 * @experimental
 */
export enum ResponseType {
    Basic = 0,
    Cors = 1,
    Default = 2,
    Error = 3,
    Opaque = 4,
}
/**
 * Supported content type to be automatically associated with a {@link Request}.
 * @experimental
 */
export enum ContentType {
    NONE = 0,
    JSON = 1,
    FORM = 2,
    FORM_DATA = 3,
    TEXT = 4,
    BLOB = 5,
    ARRAY_BUFFER = 6,
}
/**
 * Define which buffer to use to store the response
 * @experimental
 */
export enum ResponseContentType {
    Text = 0,
    Json = 1,
    ArrayBuffer = 2,
    Blob = 3,
}
}
declare module '@angular/http/src/enums' {
export * from '~@angular/http/src/enums';
}

// Generated by typings
// Source: node_modules/@angular/http/src/headers.d.ts
declare module '~@angular/http/src/headers' {
/**
 * Polyfill for [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers), as
 * specified in the [Fetch Spec](https://fetch.spec.whatwg.org/#headers-class).
 *
 * The only known difference between this `Headers` implementation and the spec is the
 * lack of an `entries` method.
 *
 * ### Example
 *
 * ```
 * import {Headers} from '@angular/http';
 *
 * var firstHeaders = new Headers();
 * firstHeaders.append('Content-Type', 'image/jpeg');
 * console.log(firstHeaders.get('Content-Type')) //'image/jpeg'
 *
 * // Create headers from Plain Old JavaScript Object
 * var secondHeaders = new Headers({
 *   'X-My-Custom-Header': 'Angular'
 * });
 * console.log(secondHeaders.get('X-My-Custom-Header')); //'Angular'
 *
 * var thirdHeaders = new Headers(secondHeaders);
 * console.log(thirdHeaders.get('X-My-Custom-Header')); //'Angular'
 * ```
 *
 * @experimental
 */
export class Headers {
    constructor(headers?: Headers | {
        [name: string]: any;
    });
    /**
     * Returns a new Headers instance from the given DOMString of Response Headers
     */
    static fromResponseHeaderString(headersString: string): Headers;
    /**
     * Appends a header to existing list of header values for a given header name.
     */
    append(name: string, value: string): void;
    /**
     * Deletes all header values for the given name.
     */
    delete(name: string): void;
    forEach(fn: (values: string[], name: string, headers: Map<string, string[]>) => void): void;
    /**
     * Returns first header that matches given name.
     */
    get(name: string): string;
    /**
     * Checks for existence of header by given name.
     */
    has(name: string): boolean;
    /**
     * Returns the names of the headers
     */
    keys(): string[];
    /**
     * Sets or overrides header value for given name.
     */
    set(name: string, value: string | string[]): void;
    /**
     * Returns values of all headers.
     */
    values(): string[][];
    /**
     * Returns string of all headers.
     */
    toJSON(): {
        [name: string]: any;
    };
    /**
     * Returns list of header values for a given name.
     */
    getAll(name: string): string[];
    /**
     * This method is not implemented.
     */
    entries(): void;
    private mayBeSetNormalizedName(name);
}
}
declare module '@angular/http/src/headers' {
export * from '~@angular/http/src/headers';
}

// Generated by typings
// Source: node_modules/@angular/http/src/http.d.ts
declare module '~@angular/http/src/http' {
import { Observable } from 'rxjs/Observable';
import { RequestOptions } from '~@angular/http/src/base_request_options';
import { ConnectionBackend, RequestOptionsArgs } from '~@angular/http/src/interfaces';
import { Request } from '~@angular/http/src/static_request';
import { Response } from '~@angular/http/src/static_response';
/**
 * Performs http requests using `XMLHttpRequest` as the default backend.
 *
 * `Http` is available as an injectable class, with methods to perform http requests. Calling
 * `request` returns an `Observable` which will emit a single {@link Response} when a
 * response is received.
 *
 * ### Example
 *
 * ```typescript
 * import {Http, HTTP_PROVIDERS} from '@angular/http';
 * import 'rxjs/add/operator/map'
 * @Component({
 *   selector: 'http-app',
 *   viewProviders: [HTTP_PROVIDERS],
 *   templateUrl: 'people.html'
 * })
 * class PeopleComponent {
 *   constructor(http: Http) {
 *     http.get('people.json')
 *       // Call map on the response observable to get the parsed people object
 *       .map(res => res.json())
 *       // Subscribe to the observable to get the parsed people object and attach it to the
 *       // component
 *       .subscribe(people => this.people = people);
 *   }
 * }
 * ```
 *
 *
 * ### Example
 *
 * ```
 * http.get('people.json').subscribe((res:Response) => this.people = res.json());
 * ```
 *
 * The default construct used to perform requests, `XMLHttpRequest`, is abstracted as a "Backend" (
 * {@link XHRBackend} in this case), which could be mocked with dependency injection by replacing
 * the {@link XHRBackend} provider, as in the following example:
 *
 * ### Example
 *
 * ```typescript
 * import {BaseRequestOptions, Http} from '@angular/http';
 * import {MockBackend} from '@angular/http/testing';
 * var injector = Injector.resolveAndCreate([
 *   BaseRequestOptions,
 *   MockBackend,
 *   {provide: Http, useFactory:
 *       function(backend, defaultOptions) {
 *         return new Http(backend, defaultOptions);
 *       },
 *       deps: [MockBackend, BaseRequestOptions]}
 * ]);
 * var http = injector.get(Http);
 * http.get('request-from-mock-backend.json').subscribe((res:Response) => doSomething(res));
 * ```
 *
 * @experimental
 */
export class Http {
    protected _backend: ConnectionBackend;
    protected _defaultOptions: RequestOptions;
    constructor(_backend: ConnectionBackend, _defaultOptions: RequestOptions);
    /**
     * Performs any type of http request. First argument is required, and can either be a url or
     * a {@link Request} instance. If the first argument is a url, an optional {@link RequestOptions}
     * object can be provided as the 2nd argument. The options object will be merged with the values
     * of {@link BaseRequestOptions} before performing the request.
     */
    request(url: string | Request, options?: RequestOptionsArgs): Observable<Response>;
    /**
     * Performs a request with `get` http method.
     */
    get(url: string, options?: RequestOptionsArgs): Observable<Response>;
    /**
     * Performs a request with `post` http method.
     */
    post(url: string, body: any, options?: RequestOptionsArgs): Observable<Response>;
    /**
     * Performs a request with `put` http method.
     */
    put(url: string, body: any, options?: RequestOptionsArgs): Observable<Response>;
    /**
     * Performs a request with `delete` http method.
     */
    delete(url: string, options?: RequestOptionsArgs): Observable<Response>;
    /**
     * Performs a request with `patch` http method.
     */
    patch(url: string, body: any, options?: RequestOptionsArgs): Observable<Response>;
    /**
     * Performs a request with `head` http method.
     */
    head(url: string, options?: RequestOptionsArgs): Observable<Response>;
    /**
     * Performs a request with `options` http method.
     */
    options(url: string, options?: RequestOptionsArgs): Observable<Response>;
}
/**
 * @experimental
 */
export class Jsonp extends Http {
    constructor(backend: ConnectionBackend, defaultOptions: RequestOptions);
    /**
     * Performs any type of http request. First argument is required, and can either be a url or
     * a {@link Request} instance. If the first argument is a url, an optional {@link RequestOptions}
     * object can be provided as the 2nd argument. The options object will be merged with the values
     * of {@link BaseRequestOptions} before performing the request.
     *
     * @security Regular XHR is the safest alternative to JSONP for most applications, and is
     * supported by all current browsers. Because JSONP creates a `<script>` element with
     * contents retrieved from a remote source, attacker-controlled data introduced by an untrusted
     * source could expose your application to XSS risks. Data exposed by JSONP may also be
     * readable by malicious third-party websites. In addition, JSONP introduces potential risk for
     * future security issues (e.g. content sniffing).  For more detail, see the
     * [Security Guide](http://g.co/ng/security).
     */
    request(url: string | Request, options?: RequestOptionsArgs): Observable<Response>;
}
}
declare module '@angular/http/src/http' {
export * from '~@angular/http/src/http';
}

// Generated by typings
// Source: node_modules/@angular/http/src/http_module.d.ts
declare module '~@angular/http/src/http_module' {
import { JSONPBackend } from '~@angular/http/src/backends/jsonp_backend';
import { CookieXSRFStrategy, XHRBackend } from '~@angular/http/src/backends/xhr_backend';
import { RequestOptions } from '~@angular/http/src/base_request_options';
import { Http, Jsonp } from '~@angular/http/src/http';
export function _createDefaultCookieXSRFStrategy(): CookieXSRFStrategy;
export function httpFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions): Http;
export function jsonpFactory(jsonpBackend: JSONPBackend, requestOptions: RequestOptions): Jsonp;
/**
 * The module that includes http's providers
 *
 * @experimental
 */
export class HttpModule {
}
/**
 * The module that includes jsonp's providers
 *
 * @experimental
 */
export class JsonpModule {
}
}
declare module '@angular/http/src/http_module' {
export * from '~@angular/http/src/http_module';
}

// Generated by typings
// Source: node_modules/@angular/http/src/interfaces.d.ts
declare module '~@angular/http/src/interfaces' {
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ReadyState, RequestMethod, ResponseContentType, ResponseType } from '~@angular/http/src/enums';
import { Headers } from '~@angular/http/src/headers';
import { Request } from '~@angular/http/src/static_request';
import { URLSearchParams } from '~@angular/http/src/url_search_params';
/**
 * Abstract class from which real backends are derived.
 *
 * The primary purpose of a `ConnectionBackend` is to create new connections to fulfill a given
 * {@link Request}.
 *
 * @experimental
 */
export abstract class ConnectionBackend {
    abstract createConnection(request: any): Connection;
}
/**
 * Abstract class from which real connections are derived.
 *
 * @experimental
 */
export abstract class Connection {
    readyState: ReadyState;
    request: Request;
    response: any;
}
/**
 * An XSRFStrategy configures XSRF protection (e.g. via headers) on an HTTP request.
 *
 * @experimental
 */
export abstract class XSRFStrategy {
    abstract configureRequest(req: Request): void;
}
/**
 * Interface for options to construct a RequestOptions, based on
 * [RequestInit](https://fetch.spec.whatwg.org/#requestinit) from the Fetch spec.
 *
 * @experimental
 */
export interface RequestOptionsArgs {
    url?: string;
    method?: string | RequestMethod;
    search?: string | URLSearchParams;
    headers?: Headers;
    body?: any;
    withCredentials?: boolean;
    responseType?: ResponseContentType;
}
/**
 * Required structure when constructing new Request();
 */
export interface RequestArgs extends RequestOptionsArgs {
    url: string;
}
/**
 * Interface for options to construct a Response, based on
 * [ResponseInit](https://fetch.spec.whatwg.org/#responseinit) from the Fetch spec.
 *
 * @experimental
 */
export type ResponseOptionsArgs = {
    body?: string | Object | FormData | ArrayBuffer | Blob;
    status?: number;
    statusText?: string;
    headers?: Headers;
    type?: ResponseType;
    url?: string;
};
}
declare module '@angular/http/src/interfaces' {
export * from '~@angular/http/src/interfaces';
}

// Generated by typings
// Source: node_modules/@angular/http/src/body.d.ts
declare module '~@angular/http/src/body' {
/**
 * HTTP request body used by both {@link Request} and {@link Response}
 * https://fetch.spec.whatwg.org/#body
 */
export abstract class Body {
    /**
     * Attempts to return body as parsed `JSON` object, or raises an exception.
     */
    json(): any;
    /**
     * Returns the body as a string, presuming `toString()` can be called on the response body.
     */
    text(): string;
    /**
     * Return the body as an ArrayBuffer
     */
    arrayBuffer(): ArrayBuffer;
    /**
      * Returns the request's body as a Blob, assuming that body exists.
      */
    blob(): Blob;
}
}
declare module '@angular/http/src/body' {
export * from '~@angular/http/src/body';
}

// Generated by typings
// Source: node_modules/@angular/http/src/static_request.d.ts
declare module '~@angular/http/src/static_request' {
import { Body } from '~@angular/http/src/body';
import { ContentType, RequestMethod, ResponseContentType } from '~@angular/http/src/enums';
import { Headers } from '~@angular/http/src/headers';
import { RequestArgs } from '~@angular/http/src/interfaces';
/**
 * Creates `Request` instances from provided values.
 *
 * The Request's interface is inspired by the Request constructor defined in the [Fetch
 * Spec](https://fetch.spec.whatwg.org/#request-class),
 * but is considered a static value whose body can be accessed many times. There are other
 * differences in the implementation, but this is the most significant.
 *
 * `Request` instances are typically created by higher-level classes, like {@link Http} and
 * {@link Jsonp}, but it may occasionally be useful to explicitly create `Request` instances.
 * One such example is when creating services that wrap higher-level services, like {@link Http},
 * where it may be useful to generate a `Request` with arbitrary headers and search params.
 *
 * ```typescript
 * import {Injectable, Injector} from '@angular/core';
 * import {HTTP_PROVIDERS, Http, Request, RequestMethod} from '@angular/http';
 *
 * @Injectable()
 * class AutoAuthenticator {
 *   constructor(public http:Http) {}
 *   request(url:string) {
 *     return this.http.request(new Request({
 *       method: RequestMethod.Get,
 *       url: url,
 *       search: 'password=123'
 *     }));
 *   }
 * }
 *
 * var injector = Injector.resolveAndCreate([HTTP_PROVIDERS, AutoAuthenticator]);
 * var authenticator = injector.get(AutoAuthenticator);
 * authenticator.request('people.json').subscribe(res => {
 *   //URL should have included '?password=123'
 *   console.log('people', res.json());
 * });
 * ```
 *
 * @experimental
 */
export class Request extends Body {
    /**
     * Http method with which to perform the request.
     */
    method: RequestMethod;
    /**
     * {@link Headers} instance
     */
    headers: Headers;
    /** Url of the remote resource */
    url: string;
    /** Type of the request body **/
    private contentType;
    /** Enable use credentials */
    withCredentials: boolean;
    /** Buffer to store the response */
    responseType: ResponseContentType;
    constructor(requestOptions: RequestArgs);
    /**
     * Returns the content type enum based on header options.
     */
    detectContentType(): ContentType;
    /**
     * Returns the content type of request's body based on its type.
     */
    detectContentTypeFromBody(): ContentType;
    /**
     * Returns the request's body according to its type. If body is undefined, return
     * null.
     */
    getBody(): any;
}
}
declare module '@angular/http/src/static_request' {
export * from '~@angular/http/src/static_request';
}

// Generated by typings
// Source: node_modules/@angular/http/src/static_response.d.ts
declare module '~@angular/http/src/static_response' {
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ResponseOptions } from '~@angular/http/src/base_response_options';
import { Body } from '~@angular/http/src/body';
import { ResponseType } from '~@angular/http/src/enums';
import { Headers } from '~@angular/http/src/headers';
/**
 * Creates `Response` instances from provided values.
 *
 * Though this object isn't
 * usually instantiated by end-users, it is the primary object interacted with when it comes time to
 * add data to a view.
 *
 * ### Example
 *
 * ```
 * http.request('my-friends.txt').subscribe(response => this.friends = response.text());
 * ```
 *
 * The Response's interface is inspired by the Response constructor defined in the [Fetch
 * Spec](https://fetch.spec.whatwg.org/#response-class), but is considered a static value whose body
 * can be accessed many times. There are other differences in the implementation, but this is the
 * most significant.
 *
 * @experimental
 */
export class Response extends Body {
    /**
     * One of "basic", "cors", "default", "error, or "opaque".
     *
     * Defaults to "default".
     */
    type: ResponseType;
    /**
     * True if the response's status is within 200-299
     */
    ok: boolean;
    /**
     * URL of response.
     *
     * Defaults to empty string.
     */
    url: string;
    /**
     * Status code returned by server.
     *
     * Defaults to 200.
     */
    status: number;
    /**
     * Text representing the corresponding reason phrase to the `status`, as defined in [ietf rfc 2616
     * section 6.1.1](https://tools.ietf.org/html/rfc2616#section-6.1.1)
     *
     * Defaults to "OK"
     */
    statusText: string;
    /**
     * Non-standard property
     *
     * Denotes how many of the response body's bytes have been loaded, for example if the response is
     * the result of a progress event.
     */
    bytesLoaded: number;
    /**
     * Non-standard property
     *
     * Denotes how many bytes are expected in the final response body.
     */
    totalBytes: number;
    /**
     * Headers object based on the `Headers` class in the [Fetch
     * Spec](https://fetch.spec.whatwg.org/#headers-class).
     */
    headers: Headers;
    constructor(responseOptions: ResponseOptions);
    toString(): string;
}
}
declare module '@angular/http/src/static_response' {
export * from '~@angular/http/src/static_response';
}

// Generated by typings
// Source: node_modules/@angular/http/src/url_search_params.d.ts
declare module '~@angular/http/src/url_search_params' {
/**
 * @experimental
 **/
export class QueryEncoder {
    encodeKey(k: string): string;
    encodeValue(v: string): string;
}
/**
 * Map-like representation of url search parameters, based on
 * [URLSearchParams](https://url.spec.whatwg.org/#urlsearchparams) in the url living standard,
 * with several extensions for merging URLSearchParams objects:
 *   - setAll()
 *   - appendAll()
 *   - replaceAll()
 *
 * This class accepts an optional second parameter of ${@link QueryEncoder},
 * which is used to serialize parameters before making a request. By default,
 * `QueryEncoder` encodes keys and values of parameters using `encodeURIComponent`,
 * and then un-encodes certain characters that are allowed to be part of the query
 * according to IETF RFC 3986: https://tools.ietf.org/html/rfc3986.
 *
 * These are the characters that are not encoded: `! $ \' ( ) * + , ; A 9 - . _ ~ ? /`
 *
 * If the set of allowed query characters is not acceptable for a particular backend,
 * `QueryEncoder` can be subclassed and provided as the 2nd argument to URLSearchParams.
 *
 * ```
 * import {URLSearchParams, QueryEncoder} from '@angular/http';
 * class MyQueryEncoder extends QueryEncoder {
 *   encodeKey(k: string): string {
 *     return myEncodingFunction(k);
 *   }
 *
 *   encodeValue(v: string): string {
 *     return myEncodingFunction(v);
 *   }
 * }
 *
 * let params = new URLSearchParams('', new MyQueryEncoder());
 * ```
 * @experimental
 */
export class URLSearchParams {
    rawParams: string;
    private queryEncoder;
    paramsMap: Map<string, string[]>;
    constructor(rawParams?: string, queryEncoder?: QueryEncoder);
    clone(): URLSearchParams;
    has(param: string): boolean;
    get(param: string): string;
    getAll(param: string): string[];
    set(param: string, val: string): void;
    setAll(searchParams: URLSearchParams): void;
    append(param: string, val: string): void;
    appendAll(searchParams: URLSearchParams): void;
    replaceAll(searchParams: URLSearchParams): void;
    toString(): string;
    delete(param: string): void;
}
}
declare module '@angular/http/src/url_search_params' {
export * from '~@angular/http/src/url_search_params';
}

// Generated by typings
// Source: node_modules/@angular/http/src/index.d.ts
declare module '~@angular/http/src/index' {
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export { BrowserXhr } from '~@angular/http/src/backends/browser_xhr';
export { JSONPBackend, JSONPConnection } from '~@angular/http/src/backends/jsonp_backend';
export { CookieXSRFStrategy, XHRBackend, XHRConnection } from '~@angular/http/src/backends/xhr_backend';
export { BaseRequestOptions, RequestOptions } from '~@angular/http/src/base_request_options';
export { BaseResponseOptions, ResponseOptions } from '~@angular/http/src/base_response_options';
export { ReadyState, RequestMethod, ResponseContentType, ResponseType } from '~@angular/http/src/enums';
export { Headers } from '~@angular/http/src/headers';
export { Http, Jsonp } from '~@angular/http/src/http';
export { HttpModule, JsonpModule } from '~@angular/http/src/http_module';
export { Connection, ConnectionBackend, RequestOptionsArgs, ResponseOptionsArgs, XSRFStrategy } from '~@angular/http/src/interfaces';
export { Request } from '~@angular/http/src/static_request';
export { Response } from '~@angular/http/src/static_response';
export { QueryEncoder, URLSearchParams } from '~@angular/http/src/url_search_params';
}
declare module '@angular/http/src/index' {
export * from '~@angular/http/src/index';
}

// Generated by typings
// Source: node_modules/@angular/http/index.d.ts
declare module '~@angular/http/index' {
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @module
 * @description
 * Entry point for all public APIs of the http package.
 */
export * from '~@angular/http/src/index';
}
declare module '@angular/http/index' {
export * from '~@angular/http/index';
}
declare module '@angular/http' {
export * from '~@angular/http/index';
}
