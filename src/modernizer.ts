//
//  modernizer.ts
//  Objective-Clean
//  
//  Created by Tanner Bennett on 2021-05-19
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import { Scanner } from "./scanner";

function NSDictionaryObjsKeysListToPairs(input: string): string {
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

function NSDictionaryLiterals(text: string): string {
    // 1: Everything before the objs+keys
    // 2: 'Mutable' | ''
    // 3: The objects and keys
    // 4: Everything after the objs+keys
    const pattern = /(\[NS(Mutable)?Dictionary\s+dictionaryWithObjectsAndKeys:)(.+?)\s*(nil\s*\])/s;
    const matches = text.match(pattern);
    
    if (!matches) return text;
    
    const prefix = matches[1];
    const mutability = matches[2] !== undefined ? '.mutableCopy' : '';
    const objsAndKeys = matches[3];
    const ending = matches[4];
    
    // Abort if we couldn't match objs & keys
    if (!objsAndKeys) return text;
    
    const keyValuePairs = NSDictionaryObjsKeysListToPairs(objsAndKeys);
    return text
        .replace(prefix, '@{')
        .replace(objsAndKeys, keyValuePairs)
        .replace(ending, `}${mutability}`);
}

function NSArrayLiterals(text: string): string {
    // 1: Everything before the values
    // 2: 'Mutable' | ''
    // 3: The objects and keys
    // 4: Everything after the objs+keys
    const pattern = /(\[NS(Mutable)?Array\s+arrayWithObjects: *)(.+)(\s*nil\s*\])/s;
    const matches = text.match(pattern);
    
    if (!matches) return text;
    
    const prefix = matches[1];
    const mutability = matches[2] !== undefined ? '.mutableCopy' : '';
    const values = matches[3];
    const ending = matches[4];
    
    // Abort if we couldn't match values
    if (!values) return text;
    
    return text
        .replace(prefix, '@[')
        .replace(ending, `]${mutability}`);
}

function NSNumberLiterals(text: string): string {
    return text
    // Number literals like @5 or @3.14
    .replace(/\[NSNumber numberWith\w+:\s*([\d\.]+)\]/g, '@$1')
    // Boolean literals like @YES
    .replace(/\[NSNumber numberWith\w+:\s*(YES|NO)\]/g, '@$1')
    // Wrapper literals like @(count)
    .replace(/\[NSNumber numberWith\w+:\s*([\w\.]+)\]/g, '@($1)');
}

function NSDictionaryAccessors(text: string): string {
    // Dictionary accessors
    return text
        .replace(/\[([^\[]+)\s+objectForKey:([^\]]+)\]/g, '$1[$2]')
        .replace(/\[([^\[]+)\s+setObject:(.+) forKey:([^\]]+)\]/g, '$1[$3] = $2');
}

function NSArrayAccessors(text: string): string {
    // Array accessors
    return text
        .replace(/\[([^\[]+)\s+objectAtIndex:([^\]]+)\]/g, '$1[$2]')
        .replace(/\[([^\[]+)\s+replaceObjectAtIndex:(.+) withObject:([^\]]+)\]/g, '$1[$2] = $3');
}

export function modernize(text: string): string {
    text = NSNumberLiterals(text);
    text = NSDictionaryLiterals(text);
    text = NSArrayLiterals(text);
    
    text = NSDictionaryAccessors(text);
    text = NSArrayAccessors(text);
    
    return text;
}
