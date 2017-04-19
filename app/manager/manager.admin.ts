/// <reference path="manager.ts"/>

function adminTools() {

    function addUser() {
        let name = (get("#newLogin") as HTMLInputElement).value;
        let password = (get("#newKey") as HTMLInputElement).value;
        let repeatPassword = (get("#newRepeatKey") as HTMLInputElement).value;
        hideDialog();
        state.manager.addUser(name, password, repeatPassword, success => {
            let message = success ? "<strong>New user added successfully!</strong>" : 
                "<strong>Failed to create new user using the data provided</strong>";
            messageBox(message);
        });
    }

    let dialog: Dialog = {
        id: "#adminTools",
        onaccept: addUser
    }
    showDialog(dialog);
}