/// <reference path="manager.ts"/>

function findFileRow(key: string | FileEntry): HTMLElement {
    if (key == undefined)
        return undefined;
    return typeof key == "string" ? get(`#file-${key}`) : get(`#file-${key.key}`);
}

function findFileEntry(key: string | HTMLElement): FileEntry {
    if (typeof key != "string") {
        if (key == undefined || key.id == undefined)
            return undefined;
        while (!key.id.startsWith("file-")) {
            key = key.parentElement;
            if (key == document.body)
                return undefined;
        }
        key = key.id.split("-")[1];
    }
    return state.files.find(e => e.key == key);
}

function findSelectedEntry(key?: string | HTMLElement) {
    let entry = findFileEntry(this);
    if (entry == undefined || !entry.selected) {
        entry = state.selectStart;
        if (entry == undefined || !entry.selected) {
            state.selectStart = undefined;
            let row = get(".file.selected");
            entry = findFileEntry(row);
            if (entry == undefined)
                return undefined;;
        }
    }
    return entry;
}

function findSelection(): Array<FileEntry> {
    let selection = [];
    let files = getAll(".file.selected");
    for (let file of files) {
        let entry = findFileEntry(file);
        selection.push(entry);
    }
    return selection;
}

function selectNone() {
    var files = getAll(".file.selected");
    for (let file of files) {
        file.removeClass("selected");
        findFileEntry(file).selected = false;
    }
    for (let file of state.files)
        file.selected = false;
    state.selectStart = undefined;
}

function initSorting() {
    if (window["initSortingDone"])
        return;
    window["initSortingDone"] = true;

    let overlays = ["overlay", "search", "audio", "page"];

    function clearMouseDown(ev: MouseEvent) {
        let node = ev.target as HTMLElement;
        while (node != document.body) {
            if (node.id == "rename")
                return;
            if (node.id.startsWith("file-"))
                return;
            if (overlays.indexOf(node.id) > -1)
                if (get("#rename.current")) {
                    hideDialog();
                    return;
                }
                else
                    return;
            node = node.parentElement;
        }
        selectNone();
    }

    function computed(query: QuerySelect): CSSStyleDeclaration {
        return getComputedStyle(get(query));
    }

    function scrollKeyDown(ev: KeyboardEvent) {
        let view = get("#view");
        switch (ev.which) {
            case Key.PageUp:
                view.scrollTop -= window.innerHeight / 2;
                break;
            case Key.PageDown:
                view.scrollTop += window.innerHeight / 2;
                break;
            case Key.Up:
                view.scrollTop -= 25;
                break;
            case Key.Down:
                view.scrollTop += 25;
                break;
        }
        ev.preventDefault();
    }

    function clearKeyDown(ev: KeyboardEvent) {
        let node = ev.target as HTMLElement;
        if (node.getBoundingClientRect().top > 0)
            return;
        if (ev.which == Key.Space) {
            let media = (get("#viewer audio") || get("#viewer video")) as HTMLMediaElement;
            if (media) {
                ev.preventDefault();
                if (media.paused)
                    media.play();
                else
                    media.pause();
            }
        }
        if (computed("#overlay").opacity != "0")
            return;
        if (computed("#audio").display != "none")
            return;
        if (ev.which == Key.Space) {
            ev.preventDefault();
            let entry = findSelectedEntry();
            selectNone();
            if (!entry)
                entry = findFileEntry(get(".files .file"));
            if (entry) {
                entry.selected = true;
                findFileRow(entry).addClass("selected");
            }                
        } else if (ev.which == Key.Enter) {
            ev.preventDefault();
            let entry = findSelectedEntry();
            if (entry)
                fileOpen(entry.key);
        } else if (ev.which == Key.Delete) {
            fileDeleteClick();
            ev.preventDefault();
        } if (ev.which == Key.F2) {
            fileRenameClick();
            ev.preventDefault();
        } else if (ev.which == Key.F3) {
            get("#search input").focus();
            ev.preventDefault();
        } else if (ev.which == Key.F4) {
            fileShareClick();
            ev.preventDefault();
        } else if (ev.which == Key.Escape) {
            selectNone();
            ev.preventDefault();
        } else if ([Key.PageUp, Key.PageDown, Key.Up, Key.Down].indexOf(ev.which) > -1) {
            let entry = findSelectedEntry();
            let row = findFileRow(entry);
            if (!row)
                return scrollKeyDown(ev);
            if (ev.which == Key.Up)
                row = row.previousElementSibling as HTMLElement;
            else if (ev.which == Key.Down)
                row = row.nextElementSibling as HTMLElement;
            else if (ev.which == Key.PageUp) {
                row = row.previousElementSibling as HTMLElement;
                if (row == null || !row.id)
                    return scrollKeyDown(ev);
                let i = 9;
                while (i > 0) {
                    let r = row.previousElementSibling as HTMLElement;
                    if (r == null || !r.id)
                        break;
                    row = r;
                    i--;
                }
            } else if (ev.which == Key.PageDown) {
                row = row.nextElementSibling as HTMLElement;
                if (row == null || !row.id)
                    return scrollKeyDown(ev);
                let i = 9;
                while (i > 0) {
                    let r = row.nextElementSibling as HTMLElement;
                    if (r == null || !r.id)
                        break;
                    row = r;
                    i--;
                }
            }
            if (row == null || !row.id)
                return scrollKeyDown(ev);
            selectNone();
            row.addClass("selected");
            findFileEntry(row).selected = true;
            let rect = row.bounds;
            let view = get("#view");
            if (rect.y - 3 < 0)
                view.scrollTop = view.scrollTop + rect.y - 3;
            else if (rect.y + 32 > window.innerHeight)
                view.scrollTop = view.scrollTop + ((rect.y + 32) - window.innerHeight);
            ev.preventDefault();
        }
    }

    document.body.addEventListener("mousedown", clearMouseDown);
    document.body.addEventListener("keydown", clearKeyDown);

    function orderBy(sort: EntrySort) {
        if (state.sort == sort)
            state.reverse = !state.reverse;
        else
            state.reverse = false;
        state.sort = sort;
        refreshFiles();
    }

    get("#row-name").addEventListener("click", () => orderBy(sortName));
    get("#row-size").addEventListener("click", () => orderBy(sortSize));
    get("#row-folder").addEventListener("click", () => orderBy(sortType));
    get("#row-modifed").addEventListener("click", () => orderBy(sortModified));
    get("#row-access").addEventListener("click", () => orderBy(sortAccess));

    let input = get("#search input") as HTMLInputElement;
    let search = "";

    setInterval(() => {
        let s = input.value.trim();
        if (s != search) {
            search = s;
            refreshFiles();
        }
    }, 200);

    input.addEventListener("focus", () => {
        get("#search span").hide();
        get("#search i").hide();
    });
    input.addEventListener("blur", () => {
        let s = input.value.trim();
        input.value = s;
        if (s.length == 0) {
            get("#search span").show();
            get("#search i").show();
        }
    });
    input.addEventListener("keyup", ev => {
        if (ev.which == 13) {
            input.blur();
        }
        else if (ev.which == 27) {
            input.value = "";
            input.blur();
        }
        ev.stopPropagation();
    });
}

function fileOpen(entry: string | FileEntry) {
    if (typeof entry == "string")
        entry = findFileEntry(entry);
    openMedia(entry);
}

function fileRenameClick() {
    var entry = findSelectedEntry(this);
    selectNone();
    entry.selected = true;
    let row = findFileRow(entry);
    row.addClass("selected");
    let rect = row.bounds;
    let view = get("#view");
    if (rect.y < 0) {
        view.scrollTop = view.scrollTop + rect.y - 20;
        rect = row.bounds;
    } else if (rect.y + 60 > window.innerHeight) {
        view.scrollTop = view.scrollTop + (rect.y + 60) - window.innerHeight;
        rect = row.bounds;
    }
    let type = entry.type.split("/")[0] + "s";
    let rename = get("#rename");
    let value = entry.name.replace(/\.[^/.]+$/, "");

    function renameAccept() {
        let name = getInput("#rename input").value.trim();
        if (value.length > 0 && value != name)
            state.manager.rename(entry.key, name, s => {
                (entry as any).name = s;
                let link = row.get("a");
                link.innerText = s;
                link.setAttribute("data-tooltip", s);
            })
        hideDialog();
    }

    function renameCancel() {
        hideDialog();
    }

    get("#renameAccept").addEventListener("click", renameAccept);
    get("#renameCancel").addEventListener("click", renameCancel);

    rename.style.left = rect.x - 7 + "px";
    rename.style.top = rect.y - 14 + "px";
    getInput("#rename input").value = value;
    let dialog: Dialog = {
        id: "#rename",
        onaccept: renameAccept
    }
    showDialog(dialog);
}

function fileShareClick() {
    let files = getAll(".file.selected");
    if (files.length < 1)
        return;
    let message = `${files.length} files selected.`;
    let keys = [];
    for (let file of files) {
        let key = file.id.split("-")[1];
        keys.push(key);
    };
    let privateCount = 0;
    let publicCount = 0;
    if (files.length == 1) {
        let entry = findFileEntry(files[0]);
        let type = entry.type.split("/")[0] + "s";
        message = `File '${type}/${entry.name}' selected.`;
        if (entry.access == 0)
            privateCount = 1;
        else
            publicCount = 1;
        let direct = `${baseUrl()}/${state.user}/${entry.type.split('/')[0]}s/${encodeURI(entry.name)}`;
        let sharedUrl = get("#shareUrl") as HTMLInputElement;
        sharedUrl.value = direct;
        let viewer = `${direct}?view`;
        let viewUrl = get("#viewUrl") as HTMLInputElement;
        viewUrl.value = viewer;
        get("#shareUrlCopy").addEventListener("click", () => {
            sharedUrl.focus();
            sharedUrl.select();
            document.execCommand("copy");
        });
        get("#viewUrlCopy").addEventListener("click", () => {
            viewUrl.focus();
            viewUrl.select();
            document.execCommand("copy");
        });
    } else {
        for (let key of keys) {
            let entry = findFileEntry(key);
            if (entry.access == 0)
                privateCount++;
            else
                publicCount++;
        }
        get("#share .block").addClass("mixed");
        get("#private span").innerText = "These files can only be accessed by you";
        get("#public span").innerText = "These files can be read by anyone if they know the url";
    }
    get("#share .message").innerText = message;
    let private = get("#private");
    let public = get("#public");
    if (privateCount > 0 && publicCount == 0)
        private.addClass("selected");
    else if (publicCount > 0 && privateCount == 0)
        public.addClass("selected");
    private.addEventListener("click", () => {
        private.addClass("selected");
        public.removeClass("selected");
    });
    public.addEventListener("click", () => {
        public.addClass("selected");
        private.removeClass("selected");
    });

    function updateAccess() {
        hideDialog();
        let access = -1;
        if (private.hasClass("selected"))
            access = 0;
        else if (public.hasClass("selected"))
            access = 1;
        if (access < 0)
            return;
        state.manager.share(keys, access);
        for (let file of files) {
            file.get(".access").innerText = access == 0 ? "private" : "public";
            findFileEntry(file).access = access;
        }
    }

    let dialog: Dialog = {
        id: "#share",
        onaccept: updateAccess
    }
    showDialog(dialog);
    get("#shareUrl").blur();
}

function fileDeleteClick() {
    let files = getAll(".file.selected");
    if (files.length == 0)
        return;
    let message = `Are you sure you want to delete these ${files.length} items?`;
    if (files.length == 1) {
        let entry = findFileEntry(files[0]);
        let type = entry.type.split("/")[0] + "s";
        message = `Are you sure you want to delete '${type}/${entry.name}'?`;
    }
    let keys = [];
    for (let file of files) {
        let key = file.id.split("-")[1];
        keys.push(key);
    };
    messageConfirm(message, () => {
        state.manager.delete(keys);
        for (let file of files)
            file.parentElement.removeChild(file);
        state.files = state.files.filter(e => keys.indexOf(e.key) < 0);
    });
}

function refreshFiles() {
    let rows = get(".files.rows");
    rows.onclick
    rows.clearChildren(".empty");
    let files = state.files;
    let input = get("#search input") as HTMLInputElement;
    let search = input.value.trim().toUpperCase();
    if (search.length > 0) {
        files = files.filter((entry) => {
            let s = entry.name.toUpperCase();
            if (s.indexOf(search) >= 0)
                return true;
            s = entry.type.toUpperCase();
            return s.indexOf(search) >= 0;
        });
    }
    if (state.reverse)
        files.sort(sortReverse(state.sort));
    else
        files.sort(state.sort);
    for (let entry of files) {
        let d = new Date(entry.modified);
        let modified = d.format("#YYYY#/#MM#/#DD# #h#:#mm#");
        let selected = entry.selected ? "selected" : "";
        let row = `
<div class="row file ${selected}" id="file-${entry.key}">
    <div><a href="javascript:fileOpen('${entry.key}')" class="tooltip fixed" data-tooltip="${entry.name}">${entry.name}</a></div>
    <div>${entry.size.toBytes()}</div>
    <div>${entry.type.split('/')[0]}</div>
    <div>${modified}</div>
    <div class="access">${entry.access == 0 ? "private" : "public"}</div>
    <div class="button delete tooltip" data-tooltip="Delete this file (Delete)"><i class="fa fa-times fa-lg"></i></div>
    <div class="button share tooltip" data-tooltip="Share this file (F4)"><i class="fa fa-share-alt fa-lg"></i></div>
    <div class="button rename tooltip" data-tooltip="Rename this file (F2)"><i class="fa fa-pencil fa-lg"></i></div>
</div>`.toElement();
        rows.appendChild(row);
    }

    function fileClick(ev: MouseEvent) {
        let ctrl = !!ev.ctrlKey;
        let shift = !!ev.shiftKey;
        let entry = findFileEntry(this);
        let count = getAll(".row.file.selected").length;
        if (count == 0)
            state.selectStart = undefined;
        let startNode = state.selectStart ? get(`#file-${state.selectStart.key}`) : undefined;
        if (shift && startNode) {
            let range = selectRange(startNode, this);
            for (let f of state.files)
                f.selected = false;
            removeClass(".row.file.selected", "selected");
            for (let r of range) {
                addClass(r, "selected");
                findFileEntry(r).selected = true;
            }
            entry.selected = true;
            addClass(this, "selected");
        } else if (ctrl) {
            if (!state.selectStart) {
                state.selectStart = entry;
                state.selectStart.selected = false;
            }
            entry.selected = !entry.selected;
            if (entry.selected)
                addClass(this, "selected");
            else
                removeClass(this, "selected");
        } else {
            for (let f of state.files)
                f.selected = false;
            entry.selected = true;
            removeClass(".row.file.selected", "selected");
            addClass(`#file-${entry.key}`, "selected");
            state.selectStart = entry;
        }
    }

    function fileMobileClick(ev: MouseEvent) {
        let entry = findFileEntry(this);
        entry.selected = !entry.selected;
        if (entry.selected) 
            addClass(this, "selected");
        else
            removeClass(this, "selected");
        ev.stopPropagation();
    }

    function fileItemDown(ev: MouseEvent) {
        let entry = findFileEntry(this);
        let node = findFileRow(entry);
        if (!entry.selected) {
            for (let f of state.files)
                f.selected = false;
            removeClass(".row.file.selected", "selected");
        }
        entry.selected = true;
        addClass(node, "selected");
        ev.stopPropagation();
    }

    if (isMobile())
        addEvent(rows.getAll(".file"), "mousedown", fileMobileClick);
    else
        addEvent(rows.getAll(".file"), "mousedown", fileClick);
    addEvent(rows.getAll(".file a"), "mousedown", fileItemDown);
    addEvent(rows.getAll(".file .button"), "mousedown", fileItemDown);
    addEvent(rows.getAll(".file .button.rename"), "click", fileRenameClick);
    addEvent(rows.getAll(".file .button.share"), "click", fileShareClick);
    addEvent(rows.getAll(".file .button.delete"), "click", fileDeleteClick);
    if (state.files.length)
        get(".files .row.empty").hide();
}