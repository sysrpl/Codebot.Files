/** Key codes */
enum Key {
    Backspace = 8,
    Tab = 9,
    Enter = 13,
    Shift = 16,
    Ctrl = 17,
    Alt = 18,
    Pause = 19,
    CapsLock = 20,
    Escape = 27,
    Space = 32,
    PageUp = 33,
    PageDown = 34,
    Left = 37,
    Up = 38,
    Right = 39,
    Down = 40,
    Insert = 45,
    Delete = 46,
    F1 = 112,
    F2 = 113,
    F3 = 114,
    F4 = 115,
    F5 = 116,
    F7 = 117,
    F8 = 118,
    F9 = 119,
    F10 = 120,
    F11 = 121,
    F12 = 122
}

interface Array<T> {
    __defineGetter__: any;
    __defineSetter__: any;
    /** Returns true if the array has an item matching a value.
     * @param value The value of the item to locate.
     */
    contains(value: T): boolean;
    /** Move items around randomly in the array. */
    shuffle(): void;
    /** The first item in the array. */
    readonly first: T;
}

Array.prototype.contains = function (value): boolean {
    return this.indexOf(value) > -1;
}

Array.prototype.shuffle = function () {
    let index = this.length, rand = 0;
    let temp;
    while (index != 0) {
        rand = Math.floor(Math.random() * index);
        index -= 1;
        temp = this[index];
        this[index] = this[rand];
        this[rand] = temp;
    }
}

Array.prototype.__defineGetter__("first", function () {
    return this[0];
});

interface Date {
    addMinutes(minutes: number): Date;
    addHours(hours: number): Date;
    addDays(days: number): Date;
}

Date.prototype.addMinutes = function (minutes) {
    return new Date(this.getTime() + minutes * 60000);
}

Date.prototype.addHours = function (hours) {
    return new Date(this.getTime() + hours * 60 * 60000);
}

Date.prototype.addDays = function (days) {
    return new Date(this.getTime() + days * 24 * 60 * 60000);
}

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Point {
    x: number;
    y: number;
}

type Proc = () => void;
type Action<T> = (t: T) => void;
type Func<T> = () => T;
type Ctor<T> = { new (): T; };
type Nullable<T> = T | undefined | void;

/** Returns true if a value is not undefined and not null.
 * @param obj The value to test.
 */
function isDefined<T>(obj: Nullable<T>): obj is T {
    return obj !== undefined && obj !== null;
}

/** Returns true if a value is undefined or null.
 * @param obj The value to test.
 */
function isUndefined<T>(obj: Nullable<T>): obj is undefined {
    return obj === undefined || obj === null;
}

/** Return true if the device is a tablet or phone. */
function isMobile(): boolean {
    return isDefined(window.orientation);
}

/** Return true if the device is a desktop browser. */
function isDesktop(): boolean {
    return isUndefined(window.orientation);
}

/** Returns a default value if a value is undefined or null.
 * @param obj The value to test.
 * @param defaultValue The value to return if obj is undefined or null. 
 */
function getDefault<T>(obj: Nullable<T>, defaultValue: T): T {
    return isDefined(obj) ? obj : defaultValue;
}

/** Returns true if an object is an array.
 * @param obj Object to check.
 */
function isArray(obj: any): boolean {
    return Array.isArray(obj);
}

/** Type guard for Boolean.
 * @param obj Object to check.
 */
function isBoolean(obj: any): obj is boolean {
    return typeof (obj) === "boolean" || obj instanceof Boolean;
}

/** Type guard for String.
 * @param obj Object to check.
 */
function isString(obj: any): obj is string {
    return typeof (obj) === "string" || obj instanceof String;
}

/** Type guard for Number.
  * @param obj Object to check.
 */
function isNumber(obj: any): obj is number {
    let result = typeof obj === "number" || obj instanceof Number;
    if (result)
        result = obj != Number.NaN;
    return result;
}

/** Type guard for classes.
  * @param obj Object to check.
  * @param type Type check (eg. String HTMLElement, Date ect).  
  */
function isTypeOf<T>(obj: any, type: { new (): T; }): obj is T {
    let t: any = type;
    if (t.name === "String")
        return isString(obj);
    if (t.name === "Number")
        return isNumber(obj);
    if (t.name === "Boolean")
        return isBoolean(obj);
    return obj instanceof type;
}

/** Try to convert a type to a number.
 * @param value The type's value for example "42".
 * @param defaultValue The value to return if coversion fails (defaults to 0).
 */
function tryParseInt(value: any, defaultValue?: number): [boolean, number] {
    let n = parseInt(value);
    return isNumber(n) ? [true, n] : [false, isNumber(defaultValue) ? defaultValue : 0];
}


/** Perform an action after a very short delay. */
function shortDelay(proc: Proc) {
    window.setTimeout(proc, 10);
}

function initTouch() {
    // TODO: add all touch events
    function translateTouchMove(event: TouchEvent) {
        let touch = event.changedTouches[0];
        let mouseEvent = document.createEvent("MouseEvent");
        mouseEvent.initMouseEvent("mousemover", true, true, window, 1,
            touch.screenX, touch.screenY, touch.clientX, touch.clientY,
            false, false, false, false, 0, null);
        touch.target.dispatchEvent(mouseEvent);
        mouseEvent.initMouseEvent("mousemove", true, true, window, 1,
            touch.screenX, touch.screenY, touch.clientX, touch.clientY,
            false, false, false, false, 0, null);
        touch.target.dispatchEvent(mouseEvent);
        event.preventDefault();
    }

    document.addEventListener("touchmove", translateTouchMove, true);
}

/** Returns the base part of the url e.g. https://sub.example.com  */
function baseUrl(): string {
    let proto = window.location.protocol || document.location.protocol;
    let port = location.port;
    if (port.length)
        port = `:${port}`;
    return `${proto}//${document.domain}${port}`;
}