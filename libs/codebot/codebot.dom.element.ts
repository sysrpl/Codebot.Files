interface ClientPoint {
	clientX: number;
	clientY: number;
}

interface HTMLElement {
	__defineGetter__: any;
	__defineSetter__: any;
	/** Clear all child elements optionally keeping some. 
	 * @param keep An optional selection of elements to keep.
	*/
	clearChildren(keep?: QuerySelect): void;
	/** Returns the nth child which is a HTMElement. 
	 * @param index The child index of the HTMElement.
	*/
	nthElementChild(index: number): HTMLElement;
	/** Returns true if the class attribute of the HTMLElement.
	 * @param value The values to check. */
	hasClass(value: string): boolean;
	/** Add values to the class attribute of the HTMLElement.
	 * @param value One or more values to add.
	 */
	addClass(...value: string[]): HTMLElement;
	/** Remove values from the class attribute of the HTMLElement. 
	 * @param value One or more values to remove.
	 */
	removeClass(...value: string[]): HTMLElement;
	/** Toggle values in the class attribute of the HTMLElement. 
	 * @param value One or more values to remove.
	 */
	toggleClass(...value: string[]): HTMLElement;
	/** Hide the HTMLElement */
	hide(): void;
	/** Show the HTMLElement */
	show(): void;
	/** Convert a client point location to point relative to the HTMLElement.
	 * @param The point relative to the window.
	 */
	mapPoint(point: ClientPoint): Point;
	/** The bounds of an HTMLElement in pixels relative to its
	 * window position. */
	readonly bounds: Rect;
}

HTMLElement.prototype.clearChildren = function (keep?: QuerySelect): void {
	let items: Array<HTMLElement> = [];
	if (keep)
		items = this.getAll(keep);
	this.innerHTML = "";
	for (let item of items)
		this.appendChild(item);
}

HTMLElement.prototype.nthElementChild = function (index: number): HTMLElement {
	let element = this.firstElementChild;
	while (index > 0) {
		index--;
		element = element.nextElementSibling;
		if (element == undefined)
			return element;
	}
	return element;
}

HTMLElement.prototype.hasClass = function (value: string): boolean {
	return this.classList.contains(value);
}

HTMLElement.prototype.addClass = function (...value: string[]): HTMLElement {
	this.classList.add(...value);
	return this;
}

HTMLElement.prototype.removeClass = function (...value: string[]): HTMLElement {
	this.classList.remove(...value);
	return this;
}

HTMLElement.prototype.toggleClass = function (...value: string[]): HTMLElement {
	for (let item in value)
		this.classList.toggle(item);
	return this;
}

HTMLElement.prototype.hide = function (): void {
	setStyle(this, { display: "none" });
}

HTMLElement.prototype.show = function (): void {
	removeStyle(this, "display");
}

HTMLElement.prototype.mapPoint = function (event: MouseEvent): Point {
	let rect = this.getBoundingClientRect();
	return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

HTMLElement.prototype.__defineGetter__("bounds", function () {
	let rect = this.getBoundingClientRect();
	return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
});

/** Return an HTMLInputElement based on a query. 
  * @param query A query idntifying the input element.
*/
function getInput(query: QuerySelect): HTMLInputElement {
	return get(query) as HTMLInputElement;
}

/** Find script node inside an HTMLElement object and executes them. 
 * @param element The HTMLElement object to search.
*/
function executeScripts(element: HTMLElement) {

	function nodeNameEquals(elem: HTMLElement, name: string) {
		return elem.nodeName && elem.nodeName.toUpperCase() == name.toUpperCase();
	}

	function evalScript(elem) {
		let data: string = (elem.text || elem.textContent || elem.innerHTML || "");
		let head = document.getElementsByTagName("head")[0] || document.documentElement;
		let script = document.createElement("script");
		script.type = "text/javascript";
		try {
			script.appendChild(document.createTextNode(data));
		} catch (e) {
			script.text = data;
		}
		head.insertBefore(script, head.firstChild);
		head.removeChild(script);
	}

	let scripts = [], script;
	let children = element.childNodes, child;
	for (var i = 0; children[i]; i++) {
		child = children[i];
		if (nodeNameEquals(child, "script") && (!child.type || child.type.toLowerCase() == "text/javascript"))
			scripts.push(child);
	}
	for (var i = 0; scripts[i]; i++) {
		script = scripts[i];
		if (script.parentNode)
			script.parentNode.removeChild(script);
		evalScript(scripts[i]);
	}
}

/** Load a javascript file asynchronously.
 * @param url The content delivery resource for the script.
 * @param callback Notification of when a script has completely loaded.
 */
function loadScript(url: string, callback: Proc): void {
	let script = document.createElement("script");
	script.type = "text/javascript";
	script.src = url;
	let loaded = false;
	script.onload = script["onreadystatechange"] = function () {
		if (!loaded && (!this.readyState || this.readyState == "complete")) {
			loaded = true;
			callback();
		}
	}
	let node = document.getElementsByTagName("script")[0];
	node.parentNode.insertBefore(script, node);
}

/** Sets the style on one or more HTMLElements.
 * @param query The selector or elements to modify.
 * @param styles A list of styles and values to be set.
 */
function setStyle(query: QuerySelect, styles: any): void {
	let elements = getAll(query);
	let keys = Object.keys(styles);
	for (let e of elements) {
		let style = e.style;
		for (let k of keys) {
			let value = styles[k];
			style[k] = isNumber(value) ? value + "px" : value;
		}
	}
}

/** Removes one or more inline styles from HTMLElements.
 * @param query The selector or elements to modify.
 * @param styles A list of styles names such as "margin-left" and "background-color".
 */
function removeStyle(query: QuerySelect, ...styles: string[]): void {
	let elements = getAll(query);
	const a = 'A'.charCodeAt(0);
	const z = 'Z'.charCodeAt(0);
	for (let style of styles) {
		let index = a;
		while (index <= z) {
			let c = String.fromCharCode(index);
			if (style.includes(c)) {
				style = style.replace(c, "-" + c.toLowerCase());
			}
			index++;
		}
		for (let element of elements)
			element.style.removeProperty(style);
	}
}

interface EventCapable {
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

/** Type guard for objects supporting addEventListener. 
 * @param obj The object to test.
 */
function isEventCapable(obj: any): obj is EventCapable {
	return isDefined(obj["addEventListener"]);
}

/** Attach an event listener to zero or more objects.
 * @param query The objects to attach the event.
 * @param name The name of the event to attach (for example "load", "resize", ect).
 * @param event The event handler to be invoked.  
 */
function addEvent(query: QuerySelect | EventCapable, name: string, event: any) {
	let items: Array<EventCapable> = isEventCapable(query) ? [query] : getAll(query);
	for (let item of items)
		item.addEventListener(name, event);
}

/** Add a value to the class attribute to zero or more HTMLElements. 
 * @param query The objects to modify.
 * @param value One or more values to add.
 */
function addClass(query: QuerySelect, ...value: string[]) {
	let items = getAll(query);
	for (let item of items)
		item.addClass(...value);
}

/** Remove a value from the class attribute to zero or more HTMLElements. 
 * @param query The objects to modify.
 * @param value One or more values to remove.
 * 
 */
function removeClass(query: QuerySelect, ...value: string[]) {
	let items = getAll(query);
	for (let item of items)
		item.removeClass(...value);
}

function isBefore(node: QuerySelect, sibling: QuerySelect): boolean {
	let a = get(node);
	if (!a)
		return false;
	let b = get(sibling);
	if (!b)
		return false;
	if (a == b)
		return false;
	if (a.parentElement != b.parentElement)
		return false;
	while (true) {
		a = <HTMLElement>a.previousElementSibling;
		if (a == b)
			return true;
		if (a == undefined)
			break;
	}
	return false;
}

function isAfter(node: QuerySelect, sibling: QuerySelect): boolean {
	let a = get(node);
	if (!a)
		return false;
	let b = get(sibling);
	if (!b)
		return false;
	if (a == b)
		return false;
	if (a.parentElement != b.parentElement)
		return false;
	while (true) {
		a = <HTMLElement>a.nextElementSibling;
		if (a == b)
			return true;
		if (a == undefined)
			break;
	}
	return false;
}

function selectRange(start: QuerySelect, finish: QuerySelect): Array<HTMLElement> {
	let a = get(start);
	if (a == undefined)
		return [];
	let b = get(finish);
	if (b == undefined)
		return [];
	if (isBefore(a, b)) {
		let c = a;
		a = b;
		b = c;
	} else if (!isAfter(a, b))
		return [];
	let selection = [];
	while (a != b) {
		selection.push(a);
		a = <HTMLElement>a.nextElementSibling;
	}
	selection.push(a);
	return selection;
}

function acceptDroppedFiles(element: HTMLElement, ondrop: Action<FileList>) {
	element.addEventListener("dragover", (e) => {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	});
	element.addEventListener("drop", (e) => {
		e.stopPropagation();
		e.preventDefault();
		ondrop(e.dataTransfer.files);
	});
}

function addStyleSheet(href: string, onload?: Proc): void {
	let link = document.createElement("link");
	link.rel = "stylesheet";
	link.type = "text/css";
	document.getElementsByTagName("head")[0].appendChild(link);
	if (onload)
		link.addEventListener("load", onload);
	link.href = href;
}

function addJavaScript(src: string, onload?: Proc): void {
	let script = document.createElement("script");
	script.type = "text/javascript";
	document.body.appendChild(script);
	if (onload)
		script.addEventListener("load", onload);
	script.src = src;
}