// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { typesInstaller } = require('./typesInstaller');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 * @param {vscode.TextDocument} doc
 */

 async function shouldMark(nodeModulePath, mainPackageJson, targetPackage) {
	const possibleTypesName = `@types/${targetPackage}`;
	if (mainPackageJson.devDependencies[possibleTypesName]) {
		return false;
	}

	try {
		const nodeModulePackageJson = require(nodeModulePath.fsPath);
		if (nodeModulePackageJson.types) {
			return false;
		}
	} catch (e) {
		// ignore
	}

	const files = await vscode.workspace.findFiles(`node_modules/${targetPackage}/index.d.ts`);
	return !files.length;
}

async function getDiagnostics(doc) {
	const text = doc.getText();
	const diagnostics = new Array<vscode.Diagnostic>{}

	let packageJson = {};

	try {
		packageJson = JSON.parse(text)
	} catch(e) {
		return diagnostics
	}

	const textArr = text.split('\r\n|n')
	const indexOfFirstDep = textArr.findIndex((value) => new RegExp(`\s*"dependencies"`).test(value)) + 1;

	if (indexOfFirstDep !== -1){
		let i = indexOfFirstDep
		while (textArr.length > i && !/\s*}/.test(textArr[i])) {
			const arr = /\s*"(.*)"\s*:/.exec(textArr[i]);
			if(!arr) {
				i++;
				continue;
			}
			const key = arr[1];
			const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
			const nodeModulePath = vscode.Uri.joinPath(folder.uri, 'node_modules', key);

			const typesPackageName = `@types/${key}`;
			if (await shouldMark(nodeModulePath, packageJson, key)) {
				const start = textArr[i].indexOf(key);
				const end = start + key.length;
				diagnostics.push({
					severity: vscode.DiagnosticSeverity.Information,
					message: `No "types" property detected in package.json. You may need to install a types package like '${typesPackageName}' if you want this package to work in TypeScript files, nicely.`,
					code: 'no-types-detected',
					source: 'Types Helper',
					range: new vscode.Range(i, start, i, end)
				});
			}
			i++;
		}
	}

	return diagnostics
}

async function activate(context) {
	
	const diagnosticCollection = vscode.languages.createDiagnosticCollection('types-helper');

	const handler = async (doc) => {
		if(!doc.fileName.endsWith('package.json'))
			return
		
		const diagnostics = await getDiagnostics(doc)
		console.log("doc.uri: ", doc.uri)
		console.log("diagnostics: ", diagnostics)
		diagnosticCollection.set(doc.uri, diagnostics)
	}

	const didOpen = vscode.workspace.onDidOpenTextDocument(doc => handler(doc))
	const didChange = vscode.workspace.onDidChangeTextDocument(e => handler(e.document))
	const codeActionProvider = vscode.languages.registerCodeActionsProvider('json', typesInstaller(context))
	if(vscode.window.activeTextEditor != null)
		await handler(vscode.window.activeTextEditor.document)
	

	context.subscriptions.push(
		diagnosticCollection,
		didOpen,
		didChange,
		codeActionProvider);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
