declare type QuerySelect = string | HTMLElement | Array<HTMLElement>;
declare function get(query: QuerySelect): HTMLElement;
declare function getAll(query: QuerySelect): Array<HTMLElement>;
interface HTMLElement {
    get(query: QuerySelect): HTMLElement;
    getAll(query: QuerySelect): Array<HTMLElement>;
}
interface String {
    includes(search: string, start?: number): boolean;
    startsWith(searchString: string, position?: number): boolean;
    endsWith(searchString: string, position?: number): boolean;
}
declare type BootModule = "ace" | "greensock" | "jquery" | "rivets" | "three";
declare class Boot {
    open(url: string, onload: (result: string, state?: any) => void, state?: any): void;
    require(script: string): void;
    use(module: BootModule | Array<BootModule>): void;
}
declare var boot: Boot;
