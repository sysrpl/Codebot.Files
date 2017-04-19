/** LocalCache is used by the Request object to capture responses.*/
class LocalCache {
    private data = {};

    remove(url: string): void {
        delete this.data[url];
    }

    exists(url: string): boolean {
        return this.data.hasOwnProperty(url) && isDefined(this.data[url]);
    }

    recall(url: string): string {
        return this.data[url];
    }

    store(url: string, value: string): void {
        this.data[url] = value;
    }
}

/** Request handles asynchronous http 'get' and 'post' requests. */
class Request {
    private localCache: LocalCache;
    private httpRequest: XMLHttpRequest;
    private cache: boolean;
    private posting: boolean;
    private callback: RequestCallback;

    private sendComplete(response: string) {
        this.response = response;
        if (this.cache) {
            this.localCache.store(this.url, this.response);
        }
        if (this.callback)
            this.callback(this);
    }

    private httpRequestLoad() {
        this.sendComplete(this.httpRequest.responseText);
    }

    constructor() {
        this.localCache = new LocalCache();
        this.httpRequest = new XMLHttpRequest();
        this.httpRequest.onload = () => this.httpRequestLoad();
        this.callback = undefined;
    }

    /** The endpoint of the last send or post operation. */
    url: string;

    /** The information returned after send completes successfully. */
    response: string;

    /** Perform an asynchronous http get request.
     * @param url The endpoint for the requested resource.
     * @param callback Your notification invoked after request completes successfully.
     * @param cache When cache is true responses are reused for each distinct url. 
     */
    send(url: string, callback?: RequestCallback, cache?: boolean): void {
        this.httpRequest.abort();
        this.url = url;
        this.callback = callback;
        this.cache = cache;
        if (cache && this.localCache.exists(url))
            this.sendComplete(this.localCache.recall(url));
        else {
            this.httpRequest.open("GET", url);
            this.httpRequest.send();
        }
    }

    /** Perform an asynchronous http post request.
     * @param url The endpoint for the requested resource.
     * @param data Data posted to recipient enpoint.
     */
    post(url: string, data: FormData | String | Object, callback?: RequestCallback, cache?: boolean): void {
        this.httpRequest.abort();
        this.url = url;
        this.callback = callback;
        this.cache = cache;
        if (cache && this.localCache.exists(url))
            this.sendComplete(this.localCache.recall(url));
        else {
            this.httpRequest.open("POST", url);
            if (data instanceof FormData || isString(data))
                this.httpRequest.send(data);
            else
                this.httpRequest.send(objectToFormData(data));
        }
    }

    /** Cancel any pending send or post operations.
     * @param url The endpoint for the requested resource.
     * @param data Data posted to recipient enpoint.
     */
    cancel(): void {
        this.httpRequest.abort();
    }
}

/** RequestCallback is the type used to notify you when send completes duccessfully. */
type RequestCallback = (request: Request) => void;

/** Perform a one off asynchronous http get request.
 * @param url The endpoint for the requested resource.
 * @param callback Optional notification invoked when the request loads.
 */
function sendRequest(url: string, callback?: RequestCallback) {
    let r = new Request();
    r.send(url, callback);
}

/** Perform a one off asynchronous http post request.
 * @param url The endpoint for the requested resource.
 * @param data A string or object posted to the enpoint.
 * @param callback Optional notification invoked when the request loads.
 */
function postRequest(url: string, data:FormData | String | Object, callback?: RequestCallback) {
    let r = new Request();
    r.post(url, data, callback);
}

/** Copies an object's enumerable properties into a FormData object.
 * @param obj An object with enumerable properties.
 * @returns A FormData object populated with values.
 */
function objectToFormData(obj: Object): FormData {
    if (obj == undefined)
        return undefined;
    let data = new FormData();
    let keys = Object.keys(obj);
    for (let k of keys) {
        let value = obj[k];
        data.append(k, value);
    }
    return data;
}

/** Perform a sumbit of a form using an XMLHttpRequest
 * @param form The HTMLFormElelemnt to submit.
 * @param prepare An option callback to prepare the request before it's sent.
 * @return The XMLHttpRequest object already sent.  
 */
function formSubmit(form: HTMLFormElement, prepare?: Action<XMLHttpRequest>): XMLHttpRequest {
    let formData = new FormData(form);
    let request = new XMLHttpRequest();
    if (prepare)
        prepare(request);
    request.open(form.getAttribute("method"), form.getAttribute("action"), true);
    request.send(formData);
    return request;
}