//
//  scanner.ts
//  Objective-Clean
//  
//  Created by Tanner Bennett on 2021-05-20
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

// import { assert } from "console";

function assert(condition: boolean): asserts condition {
    if (!condition) {
        throw new Error("Assertion failed");
    }
}

type Tags = { [key: string]: string | undefined };

export class Scanner {
    private input: string;
    private location = 0;
    
    constructor(input: string) {
        this.input = input;
    }
    
    get string(): string {
        return this.input.slice(this.location);
    }
    
    get isAtEnd(): boolean {
        return this.location >= this.input.length;
    }
    
    undo(loc: number): false {
        this.location = loc;
        return false;
    }
    
    scannedSince(loc: number): string {
        return this.input.slice(loc, this.location);
    }
    
    scanString(str: string): boolean {
        if (this.string.startsWith(str)) {
            this.location += str.length;
            return true;
        }
        
        return false;
    }
    
    scanUpToString(str: string): string | false {
        const idx = this.input.indexOf(str, this.location);
        if (idx != -1) {
            const scanned = this.string.slice(0, idx);
            this.location = idx;
            return scanned;
        }
        
        return false;
    }
    
    scanUpToPattern(pattern: RegExp): string | false {
        const idx = this.string.search(pattern);
        if (idx != -1) {
            const scanned = this.string.slice(0, idx);
            this.location += idx;
            return scanned;
        }
        
        return false;
    }
    
    scanPattern(pattern: RegExp): string | false {
        const match = this.string.match(pattern);
        if (!match || match.index != 0) {
            return false;
        }
        
        this.location += match[0].length;
        return match[0];
    }
    
    scanWhitespace(): Scanner {
        this.scanPattern(/\s*/);
        return this;
    }
    
    scanPastTagPair(opening: string, closing: string): boolean {
        // const openings = new RegExp(`(${Object.keys(possibleTags).join('|')})`);
        
        // Sanity check: we start with the opening tag
        if (!this.scanString(opening)) {
            return false;
        }
        
        // Look for the closing tag; note that this will not do advanced
        // parsing and could mess up on something like [foo bar:@"]"]
        let remaining = 1, i = this.location;
        for (i = this.location; remaining > 0 && i < this.input.length; i++) {
            const ch = this.input[i];
            // Check closing first in case opening == closing
            if (ch == closing) {
                remaining--;
            } else if (ch == opening) {
                remaining++;
            }
        }
        
        if (remaining > 0) {
            return false;
        }
        
        this.location = i;
        return true;
    }
    
    scanUpToStringAfterTags(str: string, trimLeadingWhitespace: boolean = false): string | false {
        // For aborting entirely
        const _backup = this.location;
        // For returning the scanned string
        const start = trimLeadingWhitespace ? this.scanWhitespace().location : this.location;
        
        // Sanity check: do we even contain the search string?
        if (!this.string.includes(str)) {
            return false;
        }
        
        const tags: Tags = {
            '[': ']',
            '{': '}',
            '(': ')',
            '<': '>',
            "'": "'",
            '"': '"',
            '/*': '*/'
        };
        
        const tagsOrSearchString = new RegExp(`([\[\{\(<'"]|\/\\*|${str})`);
        const openings = /([\[\{\(<'"]|\/\*)/;
        
        // Repeatedly scan up-to the braces or search string until one
        // is found. The loop terminates when the search string is found.
        while (!this.string.startsWith(str)) {
            const currString = this.string;
            
            // Scan up to either
            this.scanUpToPattern(tagsOrSearchString);
            
            // Did we find a tag?
            const opening = this.scanPattern(openings);
            if (opening !== false) {
                const closing = tags[opening];
                assert(closing != undefined);
                
                // Scan past it (back-up over the opening tag first)
                this.location -= opening.length;
                if (!this.scanPastTagPair(opening, closing)) {
                    // Abort if we don't scan a complete tag
                    return this.undo(_backup);
                }
            }
            
            // Loop will exit if opening is not found, which
            // means we finally arrived at the search string.
        }
        
        // Return thie scanned string
        return this.scannedSince(start);
    }
}
