## Features

Currently, Objective-Clean will only do the following:

- Convert `NSNumber` initializers to use `NSNumber` literals
- Convert `NS[Mutable]Dictionary|Array` initializers to use collection literals
- Convert `NS[Mutable]Dictionary|Array` accessors to use subscripting syntax

## Known Issues

For most operations, this extension uses simple regex find and replace. As a result, there may be edge cases it cannot handle or won't handle correctly without a full-blown parser. Some contrived examples:

- `[[foo bar] objectForKey:key]` may not be handled, in order for `[object method:[dict objectForKey:key]]` to work
- `[[foo bar:foo[1]] objectForKey:key]` may result in `[[foo bar:foo1]][key]`

## TODO

- [ ] Implement stricter parsing for dictionary initializers
- [ ] Implement a parser for collection accessors instead of using regex

## Release Notes

### 1.0.0

Initial release
