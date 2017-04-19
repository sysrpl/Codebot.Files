/** The static Test class can be used to aide in unit testing. */
class Test {
    /** Test a condition and write the result. 
     * @param condition The test result being considered.
     * @param name The name associated with the condition.
    */
    static verify(condition: boolean, name: string) {
        Test.writeLine(name, ": ", condition ? "success" : "fail");
    }

    /** Write a break and an optional new heading section to a document.
     * @param message Optional heading text.
     */
    static writeBreak(message?: string) {
        let h2 = document.createElement("h2");
        if (message)
            h2.innerText = message;
        document.body.appendChild(h2);
    }

    /** Write lines of text to a document. */
    static writeLine(...content: any[]) {
        let div = document.createElement("div");
        div.innerText = content.join("");
        document.body.appendChild(div);
    }
}