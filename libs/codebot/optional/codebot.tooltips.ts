function initTooltips() {
    if (get("#tipbox"))
        return;
    let tipbox = `
<div id="tipbox"><span></span>
    <img id="tip-below" src="/images/tip-below.png">
    <img id="tip-above" src="/images/tip-above.png">
</div>`.toElement();

    let timer: number;

    function tooltipOver() {
        let me = this as HTMLElement;
        timer = setTimeout(function () {
            tipbox.firstElementChild.innerHTML = me.getAttribute("data-tooltip");
            tipbox.addClass("visible");
            if (me.hasClass("fixed"))
                tipbox.addClass("fixed");
            else                
                tipbox.removeClass("fixed");
            let bounds = me.bounds;
            let x = bounds.x + (bounds.width - tipbox.offsetWidth) / 2;
            let y = bounds.y - tipbox.offsetHeight - 8;
            if (y < document.body.scrollTop) {
                y = bounds.y + bounds.height + 8;
                tipbox.addClass("below").removeClass("above");
            }
            else
                tipbox.addClass("above").removeClass("below");
            setStyle(tipbox, {
                left: x,
                top: y
            });
        }, 1000);
    }

    function tooltipOut() {
        window.clearTimeout(timer);
        tipbox.removeClass("visible");
    }

    function bodyChange() {
        let elements = getAll(".tooltip");
        for (let e of elements) {
            e.removeClass("tooltip");
            e.addEventListener("mouseover", tooltipOver);
            e.addEventListener("mouseout", tooltipOut);
        }
    }

    document.body.addEventListener("DOMNodeInserted", bodyChange);
    document.body.addEventListener("DOMNodeRemoved", tooltipOut);
    document.body.appendChild(tipbox);
    document.body.addEventListener("scroll", tooltipOut);
}