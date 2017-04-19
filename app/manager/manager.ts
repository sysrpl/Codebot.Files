/// <reference path="manager.files.ts"/>

/** Our state includes the file manager, uploads, and completed files */
interface State {
    /** The current user name */
    user: string;
    /** The FileManager that handles communication with the server */
    manager: FileManager,
    /** An array of FileEntry tracking our uploads */
    uploads: FileEntries,
    /** An array of FileEntry tracking our files */
    files: FileEntries
    /** The current sort order */
    sort: EntrySort,
    /** Switch to reverse */
    reverse: boolean,
    /** The start of the file selection */
    selectStart?: FileEntry
}

/** Our sate variable */
let state: State;

/** The secondsBetween function is a helper for fileProgress 
 * @return The decimals seconds between two javascript times
*/
function secondsBetween(a, b: number): number {
    return Math.abs((a - b) / 1000);
}

/** The fileProgress event handler is called as an upload progresses
 * @param key The unique key used to identify the file with our FileManager 
 * @param sent The bytes send so far 
 * @param total The total number of bytes in the file 
 * @return Return true to continue the transfer or false to abort
 */
function fileProgress(key: string, sent: number, total: number): boolean {
    let index = state.uploads.findIndex(e => e.key == key);
    // Just for safety, if we already removed the upload 
    if (index < 0)
        // Abort the upload, but with our other handlers this code will never execute
        return false;
    // Compute the pectage complete        
    let percent: any;
    if (total < 1)
        percent = 100;
    else
        percent = Math.floor(sent / total * 1000) / 10;
    // If the upload is complete we'll remove it at the end of this routine        
    let remove = percent == 100;
    // Update the upload meter  
    let meter = get(`#upload-${key} .meter`);
    let value = get(`#upload-${key} .value`);
    percent = percent.toString();
    if (percent.indexOf(".") < 0)
        percent = percent + ".0%";
    else
        percent = percent + "%";
    meter.style.width = percent;
    value.innerText = percent;
    // Now we can compute the transfer speed
    let entry = state.uploads[index];
    let now = Date.now();
    let seconds = secondsBetween(entry.transferTime, now);
    // For every 1 second of upload time
    if (seconds > 1) {
        // Compute the bytes transfered
        let bytes = sent - entry.transferBytes;
        entry.transferBytes = sent;
        entry.transferTime = now;
        let rate = bytes / seconds;
        // And the speed as bytes per second
        let speed = get(`#upload-${key} .speed`);
        speed.innerText = rate.toBytes() + "/s";
    }
    // Finally, check if the item need to be removed
    if (remove) {
        // Get the row
        let row = get(`#upload-${key}`);
        // And remove it
        row.parentElement.removeChild(row);
        // Remove the entry from our list
        state.uploads.splice(index, 1);
        // Set the modified time
        entry.modified = Date.now();
        // Select newly added entries
        entry.selected = true;
        // Add it to the files list
        state.files.push(entry);
        // And uplate the files
        refreshFiles();
        // Show the empty upload message if there are no more uploads             
        if (state.uploads.length == 0)
            get(".uploads .row.empty").show();
    }
    return true;
}

/** The uploadRemove function is the event handler for the upload remove buttons */
function uploadRemove() {
    // Get the row 
    let row = this.parentElement as HTMLElement;
    // Retrieve the upload key from our user interface
    let key = row.id.split("-")[1];
    // Make sure the key matches an active upload 
    let index = state.uploads.findIndex(e => e.key == key);
    if (index < 0)
        return;
    // Get the UploadEntry object 
    let entry = state.uploads[index];
    // Stop the upload 
    entry.state = UploadState.Aborted;
    // Remove the upload from our grid  
    state.uploads.splice(index, 1);
    row.parentElement.removeChild(row);
    // Show the empty upload message if there are no more uploads             
    if (state.uploads.length == 0)
        get(".uploads .row.empty").show();
}

/** The uploadPause function is the event handler for the upload pause/play buttons */
function uploadPause() {
    // Get the button
    let button: HTMLElement = this;
    // Retrieve the upload key from our user interface
    let key = button.parentElement.id.split("-")[1];
    // Make sure the key matches an active upload 
    let index = state.uploads.findIndex(e => e.key == key);
    if (index < 0)
        return;
    // Get the UploadEntry object 
    let entry = state.uploads[index];
    // Get some information about our user interface
    let speed = get(`#upload-${key} .speed`);
    let icon = button.firstElementChild as HTMLElement;
    // If the upload is processing
    if (entry.state == UploadState.Processing) {
        // Pause the upload
        entry.state = UploadState.Paused;
        // And modify the user interface
        icon.removeClass("fa-pause").addClass("fa-play");
        speed.innerText = "paused";
        button.setAttribute("data-tooltip", "Resume the upload");
    }
    // If the upload is paused
    else if (entry.state == UploadState.Paused) {
        // Continue processing the upload
        entry.state = UploadState.Processing;
        // And modify the user interface
        icon.removeClass("fa-play").addClass("fa-pause");
        speed.innerText = "resuming";
        button.setAttribute("data-tooltip", "Pause the upload");
    }
}

/** The upload function sends files from our UI to a FileManager instance
 * @param files A list of files to upload
 */
function upload(files: FileList) {
    // Loop through the files submitted
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        // Get a unique key for the file from the FileManager object
        let key = state.manager.key(file);
        // Prevent the file from being uploaded if it's already uploading
        if (state.uploads.findIndex(e => e.key == key) > -1)
            continue;
        // Start the upload and get back an UploadEntry
        let entry = state.manager.upload(file, fileProgress);
        // Store the UploadEntry in our state data
        state.uploads.push(entry);
        // Build a new upload row for our user interface
        let row = `
<div class="row upload" id="upload-${entry.key}">
    <div class="tooltip fixed" data-tooltip="${entry.name}">${entry.name}</div>
    <div>${entry.size.toBytes()}</div>
    <div>${entry.type.split("/")[0]}</div>
    <div class="progress">
        <div class="meter" style="width: 0"></div>
        <div class="value">0%</div>
    </div>
    <div class="speed">0 KB/s</div>
    <div class="button remove tooltip" data-tooltip="Remove the upload"><i class="fa fa-times fa-lg"></i></div>
    <div class="button pause tooltip" data-tooltip="Pause the upload"><i class="fa fa-pause"></i></div>
</div>`.toElement();
        // Add the row to our grid
        get(".uploads.rows").appendChild(row);
        // Assign a handler to the remove button for the new upload
        get(`#upload-${entry.key} .remove`).addEventListener("click", uploadRemove);
        // Assign a handler to the pause/play button for the new upload
        get(`#upload-${entry.key} .pause`).addEventListener("click", uploadPause);
        // Hide the empty upload message if it's visible             
        get(".uploads .row.empty").hide();
    }
}

function main() {
    state = {
        user: (get("#user") as HTMLInputElement).value,
        manager: new FileManager(),
        uploads: [],
        files: [],
        sort: sortModified,
        reverse: false
    }
    // Init the dialogs
    initDialog();
    // Init the tooltip engine
    initTooltips();
    // Init the sorting engine
    initSorting();    
    state.manager.list((files) => {
        for (let f of files)
            f.selected = false;
        state.files= files;            
        refreshFiles();
    });
    var fileInput = get("#fileInput") as HTMLInputElement
    get("#fileButton").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        upload(fileInput.files);
        fileInput.value = "";
    });
    // Add file drag and drop support
    acceptDroppedFiles(get("#fileDrop"), upload);
    // Focus the [age
    get("#page").focus();
}
