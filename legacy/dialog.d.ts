/*declare type DialogTheme = "dota" | "lazarus" | "lionfish";
declare type DialogEasing = "easy" | "rubber" | "snap" | "boing";

interface Dialog {
	title: string,
	showClose?: boolean,
	theme?: string,
	content?: string,
	ajax?: string,
	onajax?: (url: string, data: string) => boolean,
	accept?: string;
	onaccept?: () => boolean,
	cancel?: string,
	oncancel?: () => boolean,
	onshow?: () => void,
	ondestroy?: () => void,
	easing?: string,
	animate?: boolean
}

declare var currentDialog: Dialog;
declare var dialogDefaultEasing: DialogEasing;
declare var dialogDefaultTheme: DialogTheme;

declare function dialogShow(dialog: Dialog);
declare function dialogInformation(message: string, animated?: boolean): boolean;
declare function dialogError(message: string, animated?: boolean): boolean;
declare function dialogAjax(url, caption: string, animated?: boolean): boolean;
declare function dialogTest(): boolean;*/