/** The state of an UploadEntry */
enum UploadState {
    /** Not related to an upload request */
    Disconnected,
    /** Actively being uploaded */
    Processing,
    /** Paused */
    Paused,
    //* Aborted */
    Aborted,
    //* File has succesfully been uploaded */ 
    Completed,
    //* An error occured with the upload */ 
    Error
}

/** FileEntry represents a file */
interface FileEntry {
    readonly key: string;
    readonly name: string;
    readonly size: number;
    readonly type: string;
    modified: number;
    access: number,
    selected: boolean;
    state: UploadState;
    transferBytes: number;
    transferTime: number;
}

/** An array of FileEntry objects */
type FileEntries = Array<FileEntry>;

/** FileProgress is the callback type used by FileManager.upload to receive feedback on upload activity.
 * @param sent The bytes sent so far.
 * @param total The total size in bytes of the upload.
 * @return Return true to continue the upload or false to abort.
 */
type FileProgressCallback = (key: string, sent: number, total: number) => boolean;

/** FileManager implements a protocol to manage remote files. */
class FileManager {
    private endpoint: string;
    private block: number;

    constructor(endpoint?: string) {
        if (endpoint)
            this.endpoint = endpoint;
        else
            this.endpoint = "/";
        this.endpoint += "?method=files";
        // Default to a 512KB buffer size
        this.block = 512 * 1024;
    }

    get bufferSize(): number {
        return this.block;
    }

    set bufferSize(value: number) {
        const minBuffer = 32 * 1024;
        const maxBuffer = 1024 * 1024;
        if (value < minBuffer)
            value = minBuffer;
        else if (value > maxBuffer)
            value = maxBuffer;
        this.block = value;
    }

    /** Compute a key hash given a File object.
     * @param file A File object taken from a inputElement.Files collection.
     * @returns The key hash of a File object.
     */
    key(file: File): string {
        let key = window.navigator.userAgent + file.lastModifiedDate +
            file.name + file.size;
        return Math.abs(key.hashCode()).toString();
    }

    entry(file: File): FileEntry {
        return {
            key: this.key(file),
            name: file.name,
            size: file.size,
            type: file.type,
            access: 0,
            selected: false,
            modified: 0,
            state: UploadState.Disconnected,
            transferBytes: 0,
            transferTime: Date.now()
        }
    }

    addUser(name: string, password: string, repeatPassword: string, callback: Action<boolean>): void {
        if (name.length == 0 || password.length == 0) {
            callback(false);
            return;
        }
        if (password != repeatPassword) {
            callback(false);
            return;
        }
        let data = new FormData();
        data.append("name", name);
        data.append("password", password);
        data.append("repeatPassword", repeatPassword);
        postRequest(this.endpoint + "&action=adduser", data, (r => {
            let success = r.response == "OK";
            callback(success);
        }));
    }

    /** List the files on the remove server. 
     * @param callback Returns the list of files.
     */
    list(callback: Action<FileEntries>): void {
        sendRequest(this.endpoint + "&action=list", (r => {
            let files = <FileEntries>JSON.parse(r.response);
            callback(files);
        }));
    }

    /** Delete files the remove server. 
     * @param key The key identifying the upload to remove.
     */
    delete(keys: Array<string>): void {
        let data = new FormData();
        data.append("keys", JSON.stringify(keys));
        postRequest(this.endpoint + "&action=delete", data);
    }

    rename(key: string, name: string, callback: Action<string>): void {
        if (name.length < 1 || name.startsWith(".") || name.toLowerCase() == "error")
            return;
        let data = new FormData();
        data.append("key", key);
        data.append("name", name);
        postRequest(this.endpoint + "&action=rename", data, r => {
            let s = r.response;
            if (s.length == 0 || s == "Error")
                return;
            callback(s);                                
        });
    }

    /** Delete files the remove server. 
     * @param key The key identifying the upload to remove.
     */
    share(keys: Array<string>, access: number): void {
        let data = new FormData();
        data.append("keys", JSON.stringify(keys));
        data.append("access", access);
        postRequest(this.endpoint + "&action=share", data);
    }

    /** Perform a chunked upload of a file. 
     * @param file A File object taken from a inputElement.Files collection.
     * @param endpoint Url of the upload backend. (e.g. ./?method=upload)
     * @param onprogress An optional FileProgressCallback for progress notification and upload abort. 
     * @param onerror An optional callback for error notification.
     * @returns Returns A FileEntry object identifying the upload. 
     */
    upload(file: File, onprogress?: FileProgressCallback, onerror?: Proc): FileEntry {
        // Reset the buffer size
        this.bufferSize = this.block;
        let blockSize = this.bufferSize;
        // And get our end point
        let endpoint = this.endpoint + "&action=upload";
        // A file upload is aborted when onprogress returns false
        let aborted = false;
        let offset = 0;
        let name = file.name;
        let size = file.size;
        let type = file.type;
        // Key is a hash that identifies the upload
        let key = this.key(file);
        let entry = this.entry(file);
        entry.state = UploadState.Processing;

        function notifyProgress(sent: number, total: number): boolean {
            if (aborted)
                return false;
            if (entry.state == UploadState.Aborted) {
                abort();
                return false;
            }
            if (onprogress)
                aborted = !onprogress(key, sent, total);
            if (aborted) {
                abort();
                return false;
            }
            return true;
        }

        function notifyError() {
            entry.state = UploadState.Error;
            if (onerror)
                onerror();
        }

        function sendData(data: FormData, onload?: Proc) {
            let request = new XMLHttpRequest();
            request.open("POST", endpoint, true);
            if (onload)
                request.onload = onload;
            request.onerror = notifyError;
            request.send(data);
        }

        function abort() {
            aborted = true;
            entry.state = UploadState.Aborted;
            let data = new FormData();
            data.append("key", key);
            data.append("step", "abort");
            sendData(data);
        }

        function next() {
            if (aborted)
                return;
            if (entry.state == UploadState.Aborted) {
                abort();
                return;
            }
            if (entry.state == UploadState.Paused) {
                setTimeout(next, 250);
                return;
            }
            if (offset < size)
                chunk();
            else
                end();
        }

        function chunk() {
            if (!notifyProgress(offset, size))
                return abort();
            let head = offset;
            let tail = Math.min(offset + blockSize, size);
            offset = tail;
            let blob = file.slice(head, tail);
            let data = new FormData();
            data.append("key", key);
            data.append("step", "chunk");
            data.append("blob", blob);
            sendData(data, next);
        }

        function resume() {
            offset = parseInt(this.responseText);
            next();
        }

        function begin() {
            let data = new FormData();
            data.append("key", key);
            data.append("step", "begin");
            data.append("name", name);
            data.append("size", size);
            data.append("type", type);
            sendData(data, resume);
        }

        function end() {
            if (!notifyProgress(size, size))
                return abort();
            let data = new FormData();
            data.append("key", key);
            data.append("step", "end");
            sendData(data);
            entry.state = UploadState.Completed;
        }

        begin();
        return entry;
    }
}

type EntrySort = (a: FileEntry, b: FileEntry) => number;

function sortReverse(sort: EntrySort): EntrySort {
    return (a, b) => -sort(a, b);
}

function sortName(a: FileEntry, b: FileEntry): number {
    if (a.name < b.name)
        return -1;
    if (b.name < a.name)
        return 1;
    return 0;
}

function sortSize(a: FileEntry, b: FileEntry): number {
    if (a.size < b.size)
        return -1;
    if (b.size < a.size)
        return 1;
    return sortName(a, b);
}

function sortModified(a: FileEntry, b: FileEntry): number {
    if (a.modified > b.modified)
        return -1;
    if (b.modified > a.modified)
        return 1;
    return sortName(a, b);
}

function sortType(a: FileEntry, b: FileEntry): number {
    let typeA = a.type.split("/")[0];
    let typeB = b.type.split("/")[0];
    if (typeA < typeB)
        return -1;
    if (b.type < typeA)
        return 1;
    return sortName(a, b);
}

function sortAccess(a: FileEntry, b: FileEntry): number {
    if (a.access > b.access)
        return -1;
    if (b.access > a.access)
        return 1;
    return sortName(a, b);
}
