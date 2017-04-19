/** Add a cookie to the client if allowed.
 * @param name The name used to identify the cookie.
 * @param value The value stored associated with the name.
 * @param days The number of days the cookie persists.
 */
function addCookie(name: string, value: string, days?: number) {
    let expires: string;
    if (days) {
        var date = new Date();
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        date.setTime(date.getTime() + (days * millisecondsPerDay));
        expires = "; expires=" + date.toUTCString();
    }
    else
        expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

/** Remove a cookie from the client.
 * @param name The name of the cookie to be removed.
 */
function removeCookie(name: string) {
    addCookie(name, "", -1);
}

/** Read the value of a cookie from the client.
 * @param name The name of the cookie to be read.
 */
function readCookie(name: string): string {
    name += "=";
    let cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(name) == 0)
            return cookie.substring(name.length, cookie.length);
    }
    return undefined;
}
