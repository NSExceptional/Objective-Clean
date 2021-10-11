//
//  extension.ts
//  Objective-Clean
//  
//  Created by Tanner Bennett on 2021-05-19
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

'use strict';
import * as vscode from 'vscode';
import Modernizer, { OCMCommand, OCMCompoundRuleCommand } from './modernizer';

function wantsDiffPreview(): boolean {
    return vscode.workspace.getConfiguration('objective-clean').get('behavior') == 'preview';
}

async function processDocument(cmd: OCMCommand) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        
        if (wantsDiffPreview()) {
            // Generate an objc-clean scheme'd URI for the modified file
            const orig = document.uri;
            const diff = orig.with({ scheme: 'obj-clean', query: `?cmd=${cmd}` });
            const filename = orig.path.split('/').pop();
            const title = `Obj-Clean: ${filename}`;
            // Present a diff of the active file and the modified file
            vscode.commands.executeCommand('vscode.diff', document.uri, diff, title);
        } else {
            // Modify the active file immediately
            const changes = Modernizer.applyCommandToText(cmd, editor.document.getText());
            Modernizer.shared.applyChangesToTextEditor(changes, editor);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    // Register document content provider for diffing
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(
            'obj-clean', Modernizer.shared
        )
    );
    
    // Individual rules (includes the 'apply.all' command)
    for (const cmd of Object.keys(Modernizer.allRules)) {
        context.subscriptions.push(vscode.commands.registerCommand(cmd, () => {
            processDocument(cmd as OCMCommand);
        }));
    }
    
    // Compound rules
    const ruleGroups: OCMCompoundRuleCommand[] = [
        'objective-clean.rules.all',
        'objective-clean.rules.enabled',
        'objective-clean.rules.literals.all',
        'objective-clean.rules.subscripts.all',
    ];
    for (const cmd of ruleGroups) {
        context.subscriptions.push(vscode.commands.registerCommand(cmd, () => {
            processDocument(cmd);
        }));
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
