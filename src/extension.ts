//
//  extension.ts
//  Objective-Clean
//  
//  Created by Tanner Bennett on 2021-05-19
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

'use strict';
import * as vscode from 'vscode';
import { modernize } from './modernizer';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('objective-clean.modernize-file', () => {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const document = editor.document;

            // Get the word within the selection
            const fileContents = document.getText();
            const modernized = modernize(fileContents);
            
            editor.edit(editBuilder => {
                // Replace entire file contents
                var firstLine = document.lineAt(0);
                var lastLine = document.lineAt(document.lineCount - 1);
                var fullTextRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
                editBuilder.replace(fullTextRange, modernized);
            });
        }
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
