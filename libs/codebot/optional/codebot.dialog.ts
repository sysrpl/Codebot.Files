interface Dialog {
    id: string;
    caption?: string;
    content?: string;
    accept?: string;
    onaccept?: Proc;
    cancel?: string;
    oncancel?: Proc;
    oncreate?: Proc;
    ondestroy?: Proc;
}

function initDialog(): boolean {

    function acceptClick() {
        let me = <HTMLElement>this;
        let dialog = me.parentElement;
        let state = <Dialog>dialog["state"];
        if (state.onaccept)
            state.onaccept();
        else {
            hideDialog();
            let form = <HTMLFormElement>dialog.get("form");
            if (form)
                form.submit();
        }
    }

    function cancelClick() {
        let me = <HTMLElement>this;
        let dialog = me.parentElement;
        let state = <Dialog>dialog["state"];
        if (state.oncancel)
            state.oncancel();
        else
            hideDialog();
    }

    let overlay = get("#overlay");
    let dialogs = getAll("#overlay .dialog");
    let wasFullscreen: boolean;

    setInterval(() => {
        wasFullscreen = window.innerHeight == screen.height;
    }, 500);

    if (!dialogs)
        return false;
    if (overlay["initialized"] == undefined) {
        overlay["initialized"] = true;
        for (let d of dialogs) {
            d["_caption"] = d.get(".caption").innerHTML;
            d["_content"] = d.get(".content").innerHTML;
            d["_accept"] = d.get("button.accept").innerText;
            d["_cancel"] = d.get("button.cancel").innerText;
        }
        let buttons = overlay.getAll("button.accept");
        for (let b of buttons)
            b.addEventListener("click", acceptClick);
        buttons = overlay.getAll("button.cancel");
        for (let b of buttons)
            b.addEventListener("click", cancelClick);
        document.addEventListener("keyup", (e) => {
            if (!overlay.hasClass("show"))
                return;
            if (window.innerHeight == screen.height)
                return;
            let dialog = overlay.get(".dialog.current");
            if (!dialog)
                return;
            if (e.keyCode == 13) {
                let b = dialog.get("button.accept");
                if (b.style.display == "none")
                    b = b.get("button.cancel");
                b.click();
            }
            else if (e.keyCode == Key.Escape) {
                if (!wasFullscreen)
                    dialog.get("button.cancel").click();
            }
        });

    }
    return true;
}

function showDialog(dialog: string | Dialog) {
    if (!initDialog())
        return;
    let state: Dialog;
    let node: HTMLElement;
    if (isString(dialog)) {
        node = get(dialog);
        if (node == undefined)
            return;
        state = {
            id: dialog,
            caption: node.get(".caption").innerHTML,
            content: node.get(".content").innerHTML,
            accept: node.get("button.accept").innerText,
            cancel: node.get("button.cancel").innerText
        };
    } else {
        node = get(dialog.id);
        if (node == undefined)
            return;
        state = dialog;
    }
    if (window["_currentdialog"])
        return;
    let dialogs = getAll("#overlay .dialog");
    for (let d of dialogs)
        d.hide();
    node["state"] = state;
    if (isString(state.caption))
        node.get(".caption").innerHTML = state.caption;
    if (isString(state.content))
        node.get(".content").innerHTML = state.content;
    let b = node.get("button.accept");
    let s = isString(state.accept) ? state.accept : node["_accept"];
    if (s.length > 0) {
        b.innerText = s;
        b.show();
    }
    else
        b.hide();
    b = node.get("button.cancel");
    s = isString(state.cancel) ? state.cancel : node["_cancel"];
    if (s.length > 0) {
        b.innerText = s;
        b.show();
    }
    else
        b.hide();
    node.addClass("current");
    node.show();
    get("#overlay").addClass("show");
    window["_currentdialog"] = state;
    if (state.oncreate)
        state.oncreate();
    let input = node.get("input");
    if (input)
        input.focus();
}

function messageBox(message: string, caption?: string) {
    let dialog: Dialog = {
        id: "#messageBox",
        caption: caption,
        content: `<div class="message">${message}</div>`,
        accept: "",
        cancel: "OK"
    }
    showDialog(dialog);
}

function messageConfirm(message: string, onconfirm: Proc, caption?: string) {
    if (!caption)
        caption = "Confirmation";
    let dialog: Dialog = {
        id: "#messageBox",
        caption: caption,
        content: `<div class="message">${message}</div>`,
        accept: "Yes",
        onaccept: () => { hideDialog(); onconfirm(); },
        cancel: "No"
    }
    showDialog(dialog);
}

function messageInput(message: string, oninput: Action<string>, caption?: string) {
    if (!caption)
        caption = "Input";
    let dialog: Dialog = {
        id: "#messageBox",
        caption: caption,
        content: `<div class="message">${message}</div><input type="text" style="width: 100%">`,
        accept: "OK",
        onaccept: () => {
            hideDialog();
            let input = <HTMLInputElement>get("#messageBox input");
            oninput(input.value);
        },
        cancel: "Cancel"
    }
    showDialog(dialog);
}

function dialogConfirmTest() {
    messageConfirm("Delete these 23 files?", () => console.log("confirmed!"));
}

function dialogInputTest() {
    messageInput("What is your name?", (s) => console.log(`His name was ${s}`));
}

function hideDialog() {
    let state = window["_currentdialog"] as Dialog;
    window["_currentdialog"] = undefined;
    if (state && state.ondestroy)
        state.ondestroy();
    let overlay = get("#overlay.show");
    if (overlay) {
        overlay.removeClass("show");
        let c = get("#overlay .dialog.current");
        if (c) {
            c.removeClass("current");
            setTimeout(() => {
                c.get(".caption").innerHTML = c["_caption"];
                c.get(".content").innerHTML = c["_content"];
                c.get("button.accept").innerText = c["_accept"];
                c.get("button.cancel").innerText = c["_cancel"];
            }, 300);
        }
    }
}

function currentDialog(): Dialog {
    return window["_currentdialog"] as Dialog;;
}