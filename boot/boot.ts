type QuerySelect = string | HTMLElement | Array<HTMLElement>;

function get(query: QuerySelect): HTMLElement {
    if (typeof query == "string")
        return document.querySelector(query) as HTMLElement;
    if (query instanceof HTMLElement)
        return query;
    return query[0];
}

function getAll(query: QuerySelect): Array<HTMLElement> {
    if (typeof query == "string") {
        let nodes: any = document.querySelectorAll(query);
        return Array.prototype.slice.call(nodes);
    }
    if (query instanceof HTMLElement)
        return [query];
    return query;
}

interface HTMLElement {
    get(query: QuerySelect): HTMLElement;
    getAll(query: QuerySelect): Array<HTMLElement>;
}

HTMLElement.prototype.get = function (query: QuerySelect): HTMLElement {
    if (typeof query == "string")
        return this.querySelector(query) as HTMLElement;
    if (query instanceof HTMLElement)
        return query;
    return query[0];
}

HTMLElement.prototype.getAll = function (query: QuerySelect): Array<HTMLElement> {
    if (typeof query == "string") {
        let nodes: any = this.querySelectorAll(query);
        return Array.prototype.slice.call(nodes);
    }
    if (query instanceof HTMLElement)
        return [query];
    return query;
}

interface String {
    includes(search: string, start?: number): boolean;
    startsWith(searchString: string, position?: number): boolean;
    endsWith(searchString: string, position?: number): boolean;
}

if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.lastIndexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

type BootModule = "ace" | "greensock" | "jquery" | "rivets" | "three";

class Boot {
    /** @internal */
    private included = false;
    /** @internal */
    private loaded = false;
    /** @internal */
    private requestCount = 0;
    /** @internal */
    private sources = [];
    /** @internal */
    private moduleCount = 0;
    /** @internal */
    private modules = [];
    /** @internal */
    private requireCount = 0;
    /** @internal */
    private requires = [];

    /** @internal */
    private start(): void {
        if (this.included && this.loaded) {
            if (typeof window["main"] === "function") {
                console.log("started");
                window["main"]();
            }
        }
    }

    /** @internal */
    private processIncludes(): void {
        let me = this;

        function InvalidTarget(element: HTMLElement): boolean {
            let target = element.getAttribute("target-platform");
            if (target == undefined || target.length < 1)
                return false;
            let desktop = typeof window.orientation == "undefined";
            return target == "mobile" ? desktop : !desktop; 
        }

        function slice(items): Array<HTMLElement> {
            return Array.prototype.slice.call(items);
        }

        function load() {
            me.requestCount--;
            if (me.requestCount == 0)
                me.processIncludes();
        }

        var includes = slice(document.getElementsByTagName("include"));
        me.requestCount += includes.length;
        if (me.requestCount == 0) {
            me.included = true;
            me.start();
            return;
        }
        for (let item of includes) {
            var src = item.getAttribute("src");
            if (src.endsWith(".css")) {
                item.parentNode.removeChild(item);
                if (me.sources.indexOf(src) > -1 || InvalidTarget(item)) {
                    load();
                    continue;
                }
                me.sources.push(src);
                let link = document.createElement("link");
                link.rel = "stylesheet";
                link.type = "text/css";
                link.onload = () => { load(); };
                document.getElementsByTagName("head")[0].appendChild(link);
                link.href = src;
            }
            else if (src.endsWith(".js")) {
                item.parentNode.removeChild(item);
                if (me.sources.indexOf(src) > -1 || InvalidTarget(item)) {
                    load();
                    continue;
                }
                me.sources.push(src);
                let script = document.createElement("script");
                script.type = "text/javascript";
                script.onload = () => { load(); };
                document.body.appendChild(script);
                script.src = src;
            }
            else {
                let parent = item.parentNode;
                let next = item.nextSibling;
                parent.removeChild(item);
                me.open(src, (result: string, includeNode: HTMLElement) => {
                    includeNode.innerHTML = result;
                    let nodes = slice(includeNode.children);
                    while (nodes.length) {
                        let node = nodes.shift();
                        parent.insertBefore(node, next);
                    }
                    load();
                }, item);
            }
        }
    }

    /** @internal */
    private processUses(): void {
        let me = this;

        function load() {
            me.moduleCount--;
            if (me.moduleCount == 0) {
                /*me.loaded = true; me.start();*/
                me.processsRequires();
            }
        }

        var entries = {
            "ace": {
                "url": "https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.5/ace.js",
                "identifier": "Ace"
            },
            "greensock": {
                "url": "http://cdnjs.cloudflare.com/ajax/libs/gsap/1.19.0/TweenMax.min.js",
                "identifier": "TweenMax"
            },
            "jquery": {
                "url": "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js",
                "identifier": "jQuery"
            },
            "rivets": {
                "url": "https://cdnjs.cloudflare.com/ajax/libs/rivets/0.9.4/rivets.bundled.min.js",
                "identifier": "rivets"
            },
            "three": {
                "url": "https://cdnjs.cloudflare.com/ajax/libs/three.js/r80/three.min.js",
                "identifier": "THREE"
            }
        };

        me.moduleCount = me.modules.length;
        if (me.moduleCount == 0) {
            me.moduleCount = 1;
            load();
            return;
        }
        for (let key of me.modules) {
            let module = entries[key];
            if (!module || window[module.url] || me.sources.indexOf(module.url) > -1) {
                load();
                continue;
            }
            me.sources.push(module.url);
            let script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = () => { load(); }
            document.body.appendChild(script);
            script.src = module.url;
        }
    }

    /** @internal */
    private processsRequires(): void {
        let me = this;

        function load() {
            me.requireCount--;
            if (me.requireCount == 0) {
                me.loaded = true;
                me.start();
            }
        }

        me.requireCount = me.requires.length;
        if (me.requireCount == 0) {
            me.requireCount = 1;
            load();
            return;
        }
        for (let src of me.requires) {
            if (!src || window[src] || me.sources.indexOf(src) > -1) {
                load();
                continue;
            }
            me.sources.push(src);
            let script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = () => { load(); }
            document.body.appendChild(script);
            script.src = src;
        }
    }

    /** @internal */
    private app(): string {
        let metas = document.getElementsByTagName("meta");
        for (let i = 0; i < metas.length; i++) {
            let meta = metas[i];
            if (meta.getAttribute("name") == "boot")
                return meta.getAttribute("content");
        }
        return "/build/app.js";
    }

    /** @internal */
    constructor() {
        if (window["boot"])
            return;
        let me = this;
        window["boot"] = me;
        me.processIncludes();
        window.addEventListener("DOMContentLoaded", () => {
            let script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = () => me.processUses();
            document.body.appendChild(script);
            script.src = this.app();
        });
    }

    open(url: string, onload: (result: string, state?: any) => void, state?: any): void {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = () => {
            onload(request.response, state);
        }
        request.send();
    }

    require(script: string): void {
        if (this.requires.indexOf(script) < 0)
            this.requires.push(script);
    }

    use(module: BootModule | Array<BootModule>): void {
        let items = Array.isArray(module) ? module : [module];
        for (let item of items)
            if (this.modules.indexOf(item) < 0)
                this.modules.push(item);
    }
}

declare var boot: Boot;

new Boot();