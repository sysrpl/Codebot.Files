/*var currentDialog = {
	title: "title",
	showClose: true,
	theme: "dota",
	content: "<h1>content</h1>",
	ajax: "http://url.com",
	// return true to take the default action
	onajax: function (url, data) { },
	accept: "Accept",
	// return true to take the default action
	onaccept: function () { },
	cancel: "Cancel",
	// return true to take the default action
	oncancel: function () { },
	onshow: function () { },
	ondestroy: function () { },
	easing: "rubber",
	animate: true
};

currentDialog = null;
var currentDialogTime = new Date();
var dialogDefaultEasing = "easy";
var dialogDefaultTheme = "lionfish";
var dialogFadeInTime = 200;
var dialogFadeOutTime = 200;
var dialogAnimateTime = 300;

function typeIsString(x) {
	return typeof x === "string";
}

function typeIsUndefined(x) {
	return typeof x === "undefined";
}

function dialogDestroy() {
	if (currentDialog)
		if (currentDialog.ondestroy)
			currentDialog.ondestroy();
	currentDialog = null;
}

function dialogShow(dialog) {
	dialogInit();
	$("#dialogBackground").finish();
	$("#dialogContainer").finish();
	$("#dialogWindow").finish();
	dialogDestroy();
	currentDialog = dialog;
	currentDialogTime = new Date();
	currentDialogTime = currentDialogTime.getTime();
	$("#dialogBusy").hide();
	$("#dialogTitle").html(currentDialog.title);
	$("#acceptButton").html(currentDialog.accept);
	var buttonStyle = "buttonsNone";
	if (typeIsString(currentDialog.accept) && typeIsString(currentDialog.cancel)) {
		$("#acceptButton").text(currentDialog.accept);
		$("#cancelButton").text(currentDialog.cancel);
		buttonStyle = "buttonsAcceptCancel";
	}
	else if (typeIsString(currentDialog.accept)) {
		$("#acceptButton").text(currentDialog.accept);
		buttonStyle = "buttonsAccept";
	}
	else if (typeIsString(currentDialog.cancel)) {
		$("#cancelButton").text(currentDialog.cancel);
		buttonStyle = "buttonsCancel";
	}
	var windowClass = "";
	if (typeIsString(currentDialog.theme))
		windowClass = currentDialog.theme + " " + buttonStyle;
	else
		windowClass = dialogDefaultTheme + " " + buttonStyle;
	if (currentDialog.showClose === true)
		windowClass += " closable";
	document.getElementById("dialogWindow").className = windowClass;
	dialogCenter();
	$("#dialogBackground").fadeIn(dialogFadeInTime);
	var dialogContainer = $("#dialogContainer");
	var dialogWindow = $("#dialogWindow");
	var reposition = function (content) {
		$("#dialogContent").html(content);
		if (dialog.onshow) dialog.onshow();
		var cssLeft = "calc(50% - " + (dialogWindow.width() / 2) + "px)";
		var cssTop = "calc(50% - " + (dialogWindow.height() / 2) + "px)";
		dialogWindow.css({ left: cssLeft })
		dialogWindow.css({ top: cssTop })
	}
	var animation = function () {
		if (currentDialog.animate) {
			var easing = currentDialog.easing ? currentDialog.easing : dialogDefaultEasing;
			dialogWindow.css({ marginTop: -100 }).animate({ marginTop: 0 }, dialogAnimateTime, easing);
		}
		else
			dialogWindow.css({ marginTop: 0 });
	}
	if (currentDialog.ajax) {
		$("#dialogBusy").show();
		dialogContainer.hide();
		currentDialogAjax = true;
		$.ajax(currentDialog.ajax, {
			success: function (data) {
				currentDialogAjax = false;
				$("#dialogBusy").hide();
				if (typeIsUndefined(currentDialog.onajax) || currentDialog.onajax(currentDialog.ajax, data)) {
					dialogContainer.fadeIn(dialogFadeInTime);
					reposition(data);
					animation();
				}
				else if (dialog == currentDialog) {
					currentDialogTime = 0;
					dialogCancel();
				}
			},
			error: function () {
				currentDialogAjax = false;
				$("#dialogBusy").hide();
				dialogDestroy();
				dialogError("An error occurred while requesting remote data");
			}
		});

	}
	else {
		dialogContainer.show();
		reposition(currentDialog.content);
		animation();
	}
}

function dialogBusy() {
	var t = new Date().getTime();
	var seconds = (t - currentDialogTime) / 1000.0;
	return seconds < 0.5;
}

function dialogClear() {
	$("#dialogContent").html("");
}

function dialogHide() {
	if (dialogBusy())
		return;
	if (currentDialog)
		$("#dialogBackground").fadeOut(dialogFadeOutTime, dialogClear);
	dialogDestroy();
}

function dialogAccept() {
	if (dialogBusy())
		return;
	var dialog = currentDialog;
	if (dialog && dialog.onaccept) {
		if (dialog.onaccept())
			dialogHide();
	}
	else
		dialogHide();
}

function dialogCancel() {
	if (dialogBusy())
		return;
	var dialog = currentDialog;
	if (dialog && dialog.oncancel) {
		if (dialog.oncancel())
			dialogHide();
	}
	else
		dialogHide();
}

function dialogInformation(message, animated) {
	var dialog = {
		title: "Information",
		showClose: false,
		content: message,
		accept: "OK",
		animate: animated
	};
	dialogShow(dialog);
	return true;
}

function dialogError(message, animated) {
	var dialog = {
		title: "Error",
		showClose: false,
		content: message,
		cancel: "OK",
		animate: animated
	};
	dialogShow(dialog);
	return true;
}

function dialogAjax(url, caption, animated) {
	var dialog = {
		title: caption,
		accept: "OK",
		showClose: false,
		ajax: url,
		animate: animated
	};
	dialogShow(dialog);
	return true;
}

function dialogTest() {
	var dialog = {
		title: "Dialog Test Result",
		content: 'In linguistics, a yesâ€“no question, formally known as a polar question, is a question whose expected answer is either "yes" or "no". Formally, they present an exclusive disjunction, a pair of alternatives of which only one is acceptable. ',
		showClose: true,
		accept: "Yes",
		onaccept: function () { console.debug("You accepted"); return true; },
		cancel: "No",
		oncancel: function () { console.debug("You canceled"); return false; },
		animate: true
	};
	dialogShow(dialog);
	return true;
}

var
	negCosPi = 1.61803398874989;

function easingEasy(percent) {
	return percent * percent * (3.0 - 2.0 * percent);
}

function dialogInit() {
	var dialogBackground = document.getElementById("dialogBackground");
	if (dialogBackground)
		return;
	dialogBackground = document.createElement("div");
	document.body.appendChild(dialogBackground);
	dialogBackground.id = "dialogBackground";
	dialogBackground.innerHTML = '<img id="dialogBusy" src="http://cache.dotaplayer.win/images/busy.gif"><div id="dialogContainer">' +
		'<div id="dialogWindow"><div id="acceptButton"></div><div id="cancelButton"></div><div id="dialogTitle"></div><div id="dialogContent"></div>' +
		'<div id="dialogClose"></div></div></div>';
	$("#dialogClose").bind("click", dialogHide);
	$("#acceptButton").click(dialogAccept);
	$("#cancelButton").click(dialogCancel);

	$(window).resize(dialogCenter);
	$(window).scroll(dialogCenter);

	$.easing.easy = function (x, t, b, c, d) {
		if (d < 1)
			return b + c;
		return b + easingEasy(t / d) * c;
	}

	$.easing.rubber = function (x, t, b, c, d) {
		if (d < 1)
			return b + c;
		var percent = t / d;
		var result = 1.0;
		if (percent > 0.9) {
			result = percent - 0.95;
			result = 1 - result * result * 20 + (0.05 * 0.05 * 20);
		}
		else if (percent > 0.75) {
			result = percent - 0.825;
			result = 1 + result * result * 18 - (0.075 * 0.075 * 18);
		}
		else if (percent > 0.5) {
			result = percent - 0.625;
			result = 1 - result * result * 14 + (0.125 * 0.125 * 14);
		}
		else {
			percent = percent * 2;
			result = percent * percent;
		}
		return b + result * c;
	}

	$.easing.snap = function (x, t, b, c, d) {
		if (d < 1)
			return b + c;
		var percent = t / d;
		percent = (percent * 1.4) - 0.2;
		percent = 0.5 - Math.cos(Math.PI * percent) / negCosPi;
		return b + percent * c;
	}

	$.easing.boing = function (x, t, b, c, d) {
		if (d < 1)
			return b + c;
		var percent = t / d;
		percent = percent * percent;
		var result = Math.sin(Math.PI * percent * percent * 10.0 - Math.PI / 2.0) / 4.0;
		result = result * (1.0 - percent) + 1.0;
		if (percent < 0.3)
			result = result * easingEasy(percent / 0.3);
		return b + result * c;
	}

	$(document).keyup(function (e) {
		if (e.keyCode == 13)
			dialogAccept();
		else if (e.keyCode == 27)
			dialogHide();
	});
}

function dialogCenter() {
	$("#dialogBackground").css({
		top: window.scrollY,
		left: window.scrollX,
		width: window.innerWidth,
		height: window.innerHeight
	});
}*/