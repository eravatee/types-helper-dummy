const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 * @param {vscode.Range} range
 * 
 **/
 const createCommandCodeAction = (diagnostic) => {
    const text = vscode.window.activeTextEditor.document.getText(diagnostic.range);
    const action = new vscode.CodeAction(`Install @types/${text} module...`, vscode.CodeActionKind.QuickFix);
    action.diagnostics = [ diagnostic ];
    action.isPreferred = true;
    action.command = {
        command: 'types-helper.installHelperModule',
        title: 'Learn more about emojis',
        tooltip: 'This will open the unicode emoji page.',
        arguments: [ diagnostic.range ] 
    };
    return action;
}

function typesInstaller(context) {

    const command = vscode.commands.registerCommand('types-helper.installTypesModule', async (range) => {
        let text = ''
            if(vscode.window.activeTextEditor != null){
                vscode.window.activeTextEditor.document.save()
                text = vscode.window.activeTextEditor.document.getText(range)
            }
            
            const useYarn = !!(await vscode.workspace.findFiles('yarn.lock'))
            const shellExec = useYarn 
            ? new vscode.ShellExecution(`yarn add --dev @types/${text}`)
            : new vscode.ShellExecution(`npm i --save-dev @types/${text}`);
    
            vscode.tasks.executeTask(
                new vscode.Task({ type: 'typesHelper' },
                    vscode.TaskScope.Workspace,
                    'TypesHelper',
                    'Types Helper',
                    shellExec,
                    'npm'));
        });
        
    context.subscriptions.push(command)
    
    context.diagnostics.filter(diagnostic => diagnostic.code === 'no-types-detected')
    .map(diagnostic => createCommandCodeAction(diagnostic));
    
    
}
// function typesInstaller(context) {
    
//     const command = vscode.commands.registerCommand('types-helper.installTypesModule', async (range) => {
//     let text = ''
//         if(vscode.window.activeTextEditor != null){
//             vscode.window.activeTextEditor.document.save()
//             text = vscode.window.activeTextEditor.document.getText(range)
//         }
        
//         const useYarn = !!(await vscode.workspace.findFiles('yarn.lock'))
//         const shellExec = useYarn 
//         ? new vscode.ShellExecution(`yarn add --dev @types/${text}`)
//         : new vscode.ShellExecution(`npm i --save-dev @types/${text}`);

//         vscode.tasks.executeTask(
//             new vscode.Task({ type: 'typesHelper' },
//                 vscode.TaskScope.Workspace,
//                 'TypesHelper',
//                 'Types Helper',
//                 shellExec,
//                 'npm'));
//     });

//     context.subscriptions.push(command)
// }

module.exports = { typesInstaller }