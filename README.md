# Objective-Clean

Objective-Clean is a VS Code extension to modernize old Objective-C code. We've all been there: you crack open a project written by someone who learned Objc 20 years ago and never got into the habit of using collection literals and subscripting syntax, and you wish you could flip a switch to convert that code to use modern Objective-C syntax!

Well, now you can!

## Features

This extension comes with a single command, `Convert File to Modern Objective-C Syntax`, that will only do the following:

- Convert `NSNumber` initializers to use `NSNumber` literals
- Convert `NS[Mutable]Dictionary|Array` initializers to use collection literals
- Convert `NS[Mutable]Dictionary|Array` accessors to use subscripting syntax

https://user-images.githubusercontent.com/8371943/119164357-f5798100-ba21-11eb-9615-1f94564b4fcf.mp4

## Known Issues

For most operations, this extension uses simple regex find and replace. As a result, there may be edge cases it cannot handle or won't handle correctly without a full-blown parser. Some contrived examples:

- `[[foo bar] objectForKey:key]` may not be handled, in order for `[object method:[dict objectForKey:key]]` to work
- `[[foo bar:foo[1]] objectForKey:key]` may result in `[[foo bar:foo1]][key]`

## TODO

- [ ] Implement stricter parsing for dictionary initializers
- [ ] Implement a parser for collection accessors instead of using regex
- [x] Split all functionality into individual commands
  - [x] Add a command to run a list of other commands of this extension
  - [x] Add setting to choose "default" commands to run in the above setting

Add new commands for the following:
- [x] alloc-init calls to `new`
- [x] Collection `initWithCapacity:` calls to `new`/alloc-init
- [ ] Accesses of known class properties to dot syntax (i.e. `UIColor.redColor`, `UIDevice.currentDevice`)
- [x] `[[UIView alloc] initWithFrame:CGRectZero]` to `new`/alloc-init
- [x] `CGRect(0, 0, 0, 0)` to `CGRectZero`
- [ ] Remove unnecessary casts in message sends, such as `[(NSNumber *)foo boolValue]`
- [ ] Enforce proper method declaration format, i.e. `-(void) foo: (id ) bar` to `- (void)foo:(id)bar`

## Release Notes

See the [changelog](CHANGELOG.md)
