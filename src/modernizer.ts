//
//  modernizer.ts
//  Objective-Clean
//  
//  Created by Tanner Bennett on 2021-05-19
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import * as vscode from 'vscode';
import { Scanner } from './scanner';

export type Rule = (input: string) => string;

export type OCMRuleCommand = 
    'objective-clean.rules.literals.nsnumber' |
    'objective-clean.rules.literals.nsdictionary' |
    'objective-clean.rules.literals.nsarray' |
    'objective-clean.rules.subscripts.indexed' |
    'objective-clean.rules.subscripts.keyed' |
    'objective-clean.rules.constants.cgrectzero' |
    'objective-clean.rules.init.allocinit-new' |
    'objective-clean.rules.init.initwithcapacity-new' |
    'objective-clean.rules.init.initwithframe0-new' |
    'objective-clean.rules.moderncomments';

export type OCMCompoundRuleCommand =
    'objective-clean.rules.all' |
    'objective-clean.rules.enabled' |
    'objective-clean.rules.literals.all' |
    'objective-clean.rules.subscripts.all';

export type OCMCommand = OCMRuleCommand | OCMCompoundRuleCommand;

class Modernizer implements vscode.TextDocumentContentProvider {
    static shared = new Modernizer();
    
    static allRules: { [cmd in OCMRuleCommand]: Rule } = {
        'objective-clean.rules.literals.nsnumber': Modernizer.NSNumberLiterals,
        'objective-clean.rules.literals.nsdictionary': Modernizer.NSDictionaryLiterals,
        'objective-clean.rules.literals.nsarray': Modernizer.NSArrayLiterals,
        'objective-clean.rules.subscripts.indexed': Modernizer.NSArrayAccessors,
        'objective-clean.rules.subscripts.keyed': Modernizer.NSDictionaryAccessors,
        'objective-clean.rules.constants.cgrectzero': Modernizer.CGRectZero,
        'objective-clean.rules.init.allocinit-new': Modernizer.AllocInitToNew,
        'objective-clean.rules.init.initwithcapacity-new': Modernizer.InitWithCapacityToNew,
        'objective-clean.rules.init.initwithframe0-new': Modernizer.InitWithFrame0ToNew,
        'objective-clean.rules.moderncomments': Modernizer.ModernComments,
    };
    
    static compoundRulesByCmd: { [cmd in OCMCompoundRuleCommand]: Rule[] } = {
        'objective-clean.rules.all': Object.values(Modernizer.allRules),
        'objective-clean.rules.literals.all': [
            Modernizer.NSNumberLiterals,
            Modernizer.NSArrayLiterals,
            Modernizer.NSDictionaryLiterals,
        ],
        'objective-clean.rules.subscripts.all': [
            Modernizer.NSArrayAccessors,
            Modernizer.NSDictionaryAccessors,
        ],
        'objective-clean.rules.enabled': [] // Special-cased in rulesForCmd
    };
    
    static get enabledRulesCommands(): Rule[] {
        const ruleCommands = Object.entries(Modernizer.allRules);
        // Filter all rules by whether they're enabled
        const rules = ruleCommands.filter(([cmd, rule]) => {
            // Split command by . and remove last component
            let components = cmd.split('.');
            const id = components.pop()!;
            const key = components.join('.');
            return vscode.workspace.getConfiguration(key).get(id);
        });
        
        return rules.map(([cmd, rule]) => rule);
    }
    
    static rulesForCmd(cmd: OCMCommand): Rule[] {
        const compoundCmd = cmd as OCMCompoundRuleCommand;
        const singleCmd = cmd as OCMRuleCommand;
        
        if (compoundCmd == 'objective-clean.rules.enabled') {
            return Modernizer.enabledRulesCommands;
        }
        
        return Modernizer.compoundRulesByCmd[compoundCmd] ?? [Modernizer.allRules[singleCmd]];
    }
    
    static NSDictionaryObjsKeysListToPairs(input: string): string {
        const scanner = new Scanner(input);
        
        // Gather keys and values as pairs to be swapped
        const replacements: [string,string][] = [];
        while (!scanner.isAtEnd) {
            const obj = scanner.scanUpToStringAfterTags(',', true);
            scanner.scanString(',');
            const key = scanner.scanUpToStringAfterTags(',', true); // Always ends in ", nil]"
            scanner.scanString(',');
            
            if (obj && key) {
                replacements.push([obj, key]);
            } else {
                // Couldn't parse input; abort
                return input;
            }
        }
        
        for (const pair of replacements) {
            const obj = pair[0], key = pair[1];
            // Replace the key first since it is after the object.
            // Segment is 'obj, key,' here with pair ['obj', 'key']
            input = input.replace(key, obj);
            // Segment is now 'obj, obj,'
            input = input.replace(`${obj},`, `${key}:`);
            // Segment is now 'key: obj,'
        }
        
        return input;
        
        // 1: The spacing
        // 2: The object
        // 3: The key
        // const pattern = /(\s+)(.+), *(.+),/;
        // let match = input.match(pattern);
        // if (!match) return input;
        
        // // Find each `  A, B,` and convert it to `  B: A,`
        // while (match) {
        //     const spacing = match[1];
        //     const obj = match[2];
        //     const key = match[3];
        //     input = input.replace(match[0], `${spacing}${key}: ${obj},`);
        //     match = input.match(pattern);
        // }
        
        // return input;
    }

    static NSDictionaryLiterals(text: string): string {
        // 1: Everything before the objs+keys
        // 2: 'Mutable' | ''
        // 3: The objects and keys
        // 4: Everything after the objs+keys
        const pattern = /(\[NS(Mutable)?Dictionary\s+dictionaryWithObjectsAndKeys:)(.+?)\s*(nil\s*\])/s;
        let matches = text.match(pattern);
        
        while (matches) {
            const prefix = matches[1];
            const mutability = matches[2] !== undefined ? '.mutableCopy' : '';
            const objsAndKeys = matches[3];
            const ending = matches[4];
            
            // Abort if we couldn't match objs & keys
            if (!objsAndKeys) return text;
            
            const keyValuePairs = Modernizer.NSDictionaryObjsKeysListToPairs(objsAndKeys);
            text = text
                .replace(prefix, '@{')
                .replace(objsAndKeys, keyValuePairs)
                .replace(ending, `}${mutability}`);
            
            matches = text.match(pattern);
        };
        
        return text;
    }

    static NSArrayLiterals(text: string): string {
        // Handle arrayWithObject:
        text = text.replace(/\[NSArray\s+arrayWithObject:\s*(.+)\s*\]/, '@[$1]');
        
        // 1: Everything before the values
        // 2: 'Mutable' | ''
        // 3: The objects and keys
        // 4: Everything after the objs+keys
        const pattern = /(\[NS(Mutable)?Array\s+arrayWithObjects: *)(.+)(\s*nil\s*\])/s;
        let matches = text.match(pattern);
        
        while (matches) {
            
            const prefix = matches[1];
            const mutability = matches[2] !== undefined ? '.mutableCopy' : '';
            const values = matches[3];
            const ending = matches[4];
            
            // Abort if we couldn't match values
            if (!values) return text;
            
            text = text
                .replace(prefix, '@[')
                .replace(ending, `]${mutability}`);
                
            matches = text.match(pattern);
        }
        
        return text;
    }

    static NSNumberLiterals(text: string): string {
        return text
        // Number literals like @5 or @3.14
        .replace(/\[NSNumber numberWith\w+:\s*([\d\.]+)\]/g, '@$1')
        // Boolean literals like @YES
        .replace(/\[NSNumber numberWith\w+:\s*(YES|NO)\]/g, '@$1')
        // Wrapper literals like @(count)
        .replace(/\[NSNumber numberWith\w+:\s*([\w\.]+)\]/g, '@($1)');
    }

    static NSDictionaryAccessors(text: string): string {
        // Dictionary accessors
        return text
            .replace(/\[([^\[]+)\s+objectForKey:([^\]]+)\]/g, '$1[$2]')
            .replace(/\[([^\[]+)\s+setObject:(.+) forKey:([^\]]+)\]/g, '$1[$3] = $2');
    }

    static NSArrayAccessors(text: string): string {
        // Array accessors
        return text
            .replace(/\[([^\[]+)\s+objectAtIndex:([^\]]+)\]/g, '$1[$2]')
            .replace(/\[([^\[]+)\s+replaceObjectAtIndex:(.+) withObject:([^\]]+)\]/g, '$1[$2] = $3');
    }

    static CGRectZero(text: string): string {
        return text.replace(/CGRectMake\((?:0+.?0*f?\s*,\s*){3}0+.?0*f?\s*\)/g, 'CGRectZero');
    }
    
    static AllocInitToNew(text: string): string {
        return text.replace(/\[\[([\w_][\w\d_$]+) alloc\] init\]/g, '[$1 new]');
    }
    
    static InitWithCapacityToNew(text: string): string {
        return text.replace(/\[\[([\w_][\w\d_$]+) alloc\] initWithCapacity:.+\]/g, '[$1 new]');
    }
    
    static InitWithFrame0ToNew(text: string): string {
        return text.replace(/\[\[([\w_][\w\d_$]+) alloc\] initWithFrame:\s*(?:CGRectZero|CGRectMake\((?:0+.?0*f?\s*,\s*){3}0+.?0*f?\s*\))\s*]/g, '[$1 new]');
    }
    
    static ModernComments(input: string): string {
        let scanner = new Scanner(input);
        
        while (scanner.scanUpToPattern(/ *\/\*/)) {
            const start = scanner.location;
            const pre = scanner.scanned;
            const openingWithWhitespace = scanner.scanPattern(/ *\/\*\*?/) as string;
            const leadingWhitespace = openingWithWhitespace.split('/*')[0];
            const content = scanner.scanUpToString('*/');
            scanner.scanString('*/');
            const post = scanner.remaining;
            
            if (!content) {
                // Couldn't parse input; abort
                return input;
            }
            
            // Split content into individual lines
            let lines = content.split('\n').map(l => l.trimStart());
            // Remove empty lines from start and end
            if (!lines[0].length) {
                lines.shift();
            }
            if (!lines[lines.length-1].length) {
                lines.pop();
            }
            // Remove leading * and don't add leading space as most
            // comemnts like this will have a space after the *,
            // or just add a space
            lines = lines.map(l => l.startsWith('*') ? l.substr(1) : (' ' + l));
            
            // Choose slash style based on whether /** /* was used
            const slashes = openingWithWhitespace.endsWith('**') ? '///' : '//';
            const newContent = lines.map(l => `${leadingWhitespace}${slashes}${l}`).join('\n');
            input = pre + newContent + post;
            scanner = new Scanner(input);
            // Offset scanning by the length of the content, -1 for each line
            scanner.location = start + newContent.length - lines.length;
        }
        
        return input;
    }
    
    /** Applies the given rules to the text */
    static applyRules(text: string, rules: Rule[]) {
        for (const rule of rules) {
            text = rule(text);
        }
        
        return text;
    }

    /** Applies all rules to given text */
    static modernize(text: string): string {
        for (const rule of Object.values(Modernizer.allRules)) {
            text = rule(text);
        }
        
        return text;
    }
    
    static applyCommandToText(cmd: OCMCommand, text: string): string {
        return Modernizer.applyRules(text, Modernizer.rulesForCmd(cmd));
    }
    
    static applyCommandToTextEditor(cmd: OCMCommand, editor: vscode.TextEditor) {
        const fileContents = editor.document.getText();
        const modifiedContents = Modernizer.applyCommandToText(cmd, fileContents);
        Modernizer.shared.applyChangesToTextEditor(modifiedContents, editor);
    }
    
    provideTextDocumentContent(diff: vscode.Uri): vscode.ProviderResult<string> {
        // Grab command and original file URI
        const cmd = diff.query.split('cmd=')[1] as OCMCommand;
        const orig = vscode.Uri.file(diff.path);
        
        // Get text from original document, modify it, and return it
        return vscode.workspace.openTextDocument(orig).then(async (document) => {
            const fileContents = document.getText();
            const modifiedContents = Modernizer.applyCommandToText(cmd, fileContents);
            
            // Present information dialog asking to confirm changes
            const msg = "Apply changes? This will overwrite the open editor.";
            vscode.window.showInformationMessage(msg, "Yes", "No").then((choice) => {
                if (choice == "Yes") {
                    this.applyChangesToFile(modifiedContents, orig, diff);
                }
            });
            
            return modifiedContents;
        });
    }
    
    areURIsEqual(first?: vscode.Uri, second?: vscode.Uri): boolean {
        if (!first || !second) { return false; }
        return first.toString(true) == second.toString(true);
    }
    
    applyChangesToFile(changes: string, uri: vscode.Uri, diff: vscode.Uri): boolean {
        // Check the active editor first
        if (this.areURIsEqual(uri, vscode.window.activeTextEditor?.document.uri)) {
            this.applyChangesToTextEditor(changes, vscode.window.activeTextEditor!, diff);
            return true;
        }
        
        // Check all other editors
        for (const editor of vscode.window.visibleTextEditors) {
            if (this.areURIsEqual(uri, editor.document.uri)) {
                this.applyChangesToTextEditor(changes, editor, diff);
                return true;
            }
        }
        
        return false;
    }
    
    applyChangesToTextEditor(changes: string, editor: vscode.TextEditor, diff?: vscode.Uri) {
        const document = editor.document;
        editor.edit(async editBuilder => {
            // Replace entire file contents
            var firstLine = document.lineAt(0);
            var lastLine = document.lineAt(document.lineCount - 1);
            var fullTextRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
            editBuilder.replace(fullTextRange, changes);
            
            // Close diff view, if any, by bringing it to the front then closing the active editor
            if (diff) {
                await vscode.window.showTextDocument(diff, { preview: true, preserveFocus: false });
                return vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        });
    }
}

export default Modernizer;
