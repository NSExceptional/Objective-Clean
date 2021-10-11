## Initial release | 2021-05-20
- Adds a single command to do the following:
  - Convert `NSNumber` initializers to use `NSNumber` literals
  - Convert `NS[Mutable]Dictionary|Array` initializers to use collection literals
  - Convert `NS[Mutable]Dictionary|Array` accessors to use subscripting syntax

## 2.0.0 | 2021-05-22
- Implement many new commands
- Add settings to enable or disable certain rules
- Add ability to preview changes in a diff first
- Add ability to run all rules or only enabled rules

## 2.1.0 | 2021-08-07
- Support converting C-style block comments to triple-slash comments
- Fix a bug where no-preview mode wouldn't change the file correctly
