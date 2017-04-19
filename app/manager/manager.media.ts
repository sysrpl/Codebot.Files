function downloadSingle() {
    let entry = state.selectStart;
    if (!entry)
        return;
    let a = get("#downloader") as HTMLAnchorElement;
    a.href = `/${state.user}/${entry.type.split('/')[0]}s/${encodeURI(entry.name)}?download`;
    a.click();
}

function downloadAll() {
    let a = get("#downloader") as HTMLAnchorElement;
    let selection = findSelection();
    let i = 0;
    for (let entry of selection) {
        let s = `/${state.user}/${entry.type.split('/')[0]}s/${encodeURI(entry.name)}?download`;
        setTimeout(() => {
            console.log(s);
            a.href = s;
            a.click();
        }, i++ * 500 + 250);
    }
}

function openMedia(entry: FileEntry): boolean {
    if (entry == undefined)
        return;
    let selection = findSelection();
    get("#viewer .close").addEventListener("click", hideDialog);
    get("#downloadSingle").style.display = "block";
    if (selection.length > 1)
        get("#downloadAll").style.display = "block";
    let busy = get("#viewer .content .busy");
    let content = get("#viewer .content");
    let summary = get("#viewer .summary");
    let words = get("#viewer .words");
    let extra = get("#viewer .extra");
    let marker = window["_marker"] as number;
    if (!marker)
        marker = 1;
    let autoplay = false;

    function addSummary(tail: string) {
        words.innerText = state.selectStart.name;
        extra.innerText = tail;
        busy.removeClass("loading");
        summary.removeClass("loading");
        let w = 12;
        let child = summary.firstElementChild as HTMLElement;
        while (child) {
            w += child.offsetWidth + 10;
            child = child.nextElementSibling as HTMLElement;
        }
        let x = (content.offsetWidth - w) / 2;
        setStyle(summary, {
            left: x,
            width: w
        });
    }

    function imageLoad() {
        marker++;
        let image = this as HTMLImageElement;
        let s = `${image.naturalWidth}x${image.naturalHeight}`;
        addSummary(s);
    }

    function textLoad(r: Request) {
        marker++;
        let text = get("#viewer .content span pre");
        let data = r.response;
        let size = data.length;
        data = data.replace(/\t/g, "  ");
        text.innerText = data;
        let s = `${state.selectStart.size.toBytes()}`;
        addSummary(s);
    }

    function mediaLoad() {
        marker++;
        let audio = get("#viewer span audio") as HTMLAudioElement;
        if (audio) {
            audio.currentTime = 0;
            audio.addEventListener("ended", () => {
                index++;
                if (index >= selection.length)
                    index = 0;
                let entry = selection[index];
                let type = entry.type.split('/')[0];
                autoplay = type == "audio";
                update();
            });
            if (autoplay)
                audio.play();
            autoplay = false;
        }
        let video = get("#viewer span video");
        let media = (audio ? audio : video) as HTMLMediaElement;
        let s = `${media.duration.toTimeSpan()}`;
        addSummary(s);
    }

    function mediaTimeout() {
        autoplay = false;
        get("#viewer span").innerHTML = "Unable to load preview for this file";
        let s = `${state.selectStart.size.toBytes()}`;
        addSummary(s);
    }

    let index = selection.findIndex(e => e.key == entry.key);
    marker++;
    let localMarker = marker;
    
    function update() {
        let entry = selection[index];
        state.selectStart = entry;
        busy.addClass("loading");
        summary.addClass("loading");
        words.innerText = `${entry.name}`;
        let type = entry.type.split('/')[0];
        let ext = entry.type.split('/')[1];
        let link = `/${state.user}/${type}s/${encodeURI(entry.name)}`
        let span = get("#viewer span")
        span.clearChildren();
        switch (type) {
            case "image":
                let image = document.createElement("img");
                span.appendChild(image);
                image.addEventListener("load", imageLoad);
                image.src = link;
                break;
            case "text":
                let text = document.createElement("pre");
                span.appendChild(text);
                sendRequest(link, textLoad);
                break;
            case "audio":
                let audio = document.createElement("audio");
                audio.addEventListener("loadedmetadata", mediaLoad);
                let audioSource = document.createElement("source");
                audioSource.type = entry.type;
                audioSource.src = link;
                audio.appendChild(audioSource);
                span.appendChild(audio);
                audio.controls = true;
                break;
            case "video":
                let video = document.createElement("video");
                video.addEventListener("loadedmetadata", mediaLoad);
                let videoSource = document.createElement("source");
                videoSource.type = entry.type;
                videoSource.src = link;
                video.appendChild(videoSource);
                span.appendChild(video);
                video.controls = true;
                break;
            default:
                marker++;
                mediaTimeout();
                return;
        }
        setTimeout(() => {
            if (localMarker == marker)
                mediaTimeout();
        }, isMobile() ? 15000 : 5000);
    }

    function prior() {
        autoplay = false;
        index--;
        if (index < 0)
            index = selection.length - 1;
        update();
    }

    function next() {
        autoplay = false;
        index++;
        if (index >= selection.length)
            index = 0;
        update();
    }

    function viewerKeyDown(ev: KeyboardEvent) {
        if (selection.length < 2)
            return;
        switch (ev.which) {
            case Key.Left:
                prior();
                ev.preventDefault();
                return;
            case Key.Right:
                next();
                ev.preventDefault();
                return;
        }
    }

    update();
    if (selection.length == 1) {
        get("#viewer .prior").hide();
        get("#viewer .next").hide();

    } else {
        get("#viewer .prior").addEventListener("click", prior);
        get("#viewer .next").addEventListener("click", next);
    }

    var dialog: Dialog = {
        id: "#viewer",
        onaccept: () => { },
        oncreate: () => {
            document.body.addEventListener("keydown", viewerKeyDown);
        },
        ondestroy: () => {
            marker++;
            window["_marker"] = marker;
            document.body.removeEventListener("keydown", viewerKeyDown);
        }
    }
    showDialog(dialog);
    return true;
} 