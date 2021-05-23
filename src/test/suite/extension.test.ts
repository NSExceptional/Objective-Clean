//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

import * as assert from 'assert';
import { modernize } from '../../modernizer';

const testString = `
- (void)method {
    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
        self.filterName, @"filterName",
        self.filterText, @"filterText",
        [NSNumber numberWithInt:self.blockType], @"blockType",
        [NSNumber numberWithInt:self.filterType], @"filterType",
        [NSNumber numberWithBool:self.onSchedule], @"onSchedule",
        [NSNumber numberWithBool:self.whitelistMode], @"whitelistMode",
        [NSNumber numberWithBool:self.showInNotificationCenter], @"showInNotificationCenter",
        self.startTime, @"startTime",
        self.endTime, @"endTime",
        self.weekDays, @"weekDays",
    nil];
  
    NSArray *planets = [NSArray arrayWithObject: @"earth"];
    NSArray *months = [NSArray arrayWithObjects:
        @"Jan", @"Feb",
        @"Mar", @"Apr,
        @"May", @"Jun",
        @"Jul", @"Aug",
        @"Sept, @"Oct",
        @"Nov", @"Dec",
        nil];
    NSArray *weekdays = [NSArray arrayWithObjects: @"Sun", @"Mon", @"Tue", @"Wed", @"Thu",@"Fri", @"Sat", nil];
    id monday = [weekdays objectAtIndex:1];
    
    NSMutableArray *mutableWeekdays = weekdays.mutableCopy;
    [mutableWeekdays replaceObjectAtIndex:3 withObject:monday];
    
    self.filterName = [dict objectForKey:@"filterName"];
    self.filterType = [((NSNumber*)[dict objectForKey:@"filterType"]) intValue];

    if ([dict objectForKey:@"appToBlockIdentifier"] != nil) {
        AppInfo *app = [[AppInfo alloc] init];
        app.appIdentifier = [dict objectForKey:@"appToBlockIdentifier"];
        app.appName = [dict objectForKey:@"appToBlockName"];
        self.appToBlock = app;
    }
    
    self.onSchedule = [((NSNumber*)[dict objectForKey:@"onSchedule"]) boolValue];
    self.whitelistMode = [((NSNumber*)[dict objectForKey:@"whitelistMode"]) boolValue];
    self.showInNotificationCenter = [((NSNumber*)[dict objectForKey:@"showInNotificationCenter"]) boolValue];

    self.startTime = [dict objectForKey:@"startTime"];
    self.endTime = [dict objectForKey:@"endTime"];
    self.weekDays = [NSMutableArray arrayWithArray:[dict objectForKey:@"weekDays"]];
    
    id five = [NSNumber numberWithInteger:5];
    id pi = [NSNumber numberWithDouble:3.14];
    id yes = [NSNumber numberWithBool:YES];
    id no = [NSNumber numberWithBool:NO];
    id filtertype = [NSNumber numberWithInt:self.filterType];
    id view = [[UIButton alloc] initWithFrame:CGRectMake(0, 0.0, 0, 0)];
    CGRect *rects = {
        CGRectMake(0,0,0,0),
        CGRectMake(0, 0, 0, 0),
        CGRectMake(0.0,0.0,0.0,0.0),
        CGRectMake(0.0, 0.0, 0.0, 0.0),
        CGRectMake(0.0 , 0, 0.f, 0.0f),
    };
    
    id five = [NSNumber numberWithInteger:5];
    id pi = [NSNumber numberWithDouble:3.14];
    id yes = [NSNumber numberWithBool:YES];
    id no = [NSNumber numberWithBool:NO];
    id filtertype = [NSNumber numberWithInt:self.filterType];
    id view = [[UIButton alloc] initWithFrame:CGRectMake(0, 0.0, 0, 0)];
    CGRect *rects = {
        CGRectMake(0,0,0,0),
        CGRectMake(0, 0, 0, 0),
        CGRectMake(0.0,0.0,0.0,0.0),
        CGRectMake(0.0, 0.0, 0.0, 0.0),
        CGRectMake(0.0 , 0, 0.f, 0.0f),
    };
}
`;

const testStringFixed = `
- (void)method {
    NSMutableDictionary *dict = @{
        @"filterName": self.filterName,
        @"filterText": self.filterText,
        @"blockType": @(self.blockType),
        @"filterType": @(self.filterType),
        @"onSchedule": @(self.onSchedule),
        @"whitelistMode": @(self.whitelistMode),
        @"showInNotificationCenter": @(self.showInNotificationCenter),
        @"startTime": self.startTime,
        @"endTime": self.endTime,
        @"weekDays": self.weekDays,
    }.mutableCopy;
  
    NSArray *planets = @[@"earth"];
    NSArray *months = @[
        @"Jan", @"Feb",
        @"Mar", @"Apr,
        @"May", @"Jun",
        @"Jul", @"Aug",
        @"Sept, @"Oct",
        @"Nov", @"Dec",
        ];
    NSArray *weekdays = @[@"Sun", @"Mon", @"Tue", @"Wed", @"Thu",@"Fri", @"Sat", ];
    id monday = weekdays[1];
    
    NSMutableArray *mutableWeekdays = weekdays.mutableCopy;
    mutableWeekdays[3] = monday;
    
    self.filterName = dict[@"filterName"];
    self.filterType = [((NSNumber*)dict[@"filterType"]) intValue];

    if (dict[@"appToBlockIdentifier"] != nil) {
        AppInfo *app = [AppInfo new];
        app.appIdentifier = dict[@"appToBlockIdentifier"];
        app.appName = dict[@"appToBlockName"];
        self.appToBlock = app;
    }
    
    self.onSchedule = [((NSNumber*)dict[@"onSchedule"]) boolValue];
    self.whitelistMode = [((NSNumber*)dict[@"whitelistMode"]) boolValue];
    self.showInNotificationCenter = [((NSNumber*)dict[@"showInNotificationCenter"]) boolValue];

    self.startTime = dict[@"startTime"];
    self.endTime = dict[@"endTime"];
    self.weekDays = [NSMutableArray arrayWithArray:dict[@"weekDays"]];
    
    id five = @5;
    id pi = @3.14;
    id yes = @YES;
    id no = @NO;
    id filtertype = @(self.filterType);
    id view = [UIButton new];
    CGRect *rects = {
        CGRectZero,
        CGRectZero,
        CGRectZero,
        CGRectZero,
        CGRectZero,
    };
    
    id five = @5;
    id pi = @3.14;
    id yes = @YES;
    id no = @NO;
    id filtertype = @(self.filterType);
    id view = [UIButton new];
    CGRect *rects = {
        CGRectZero,
        CGRectZero,
        CGRectZero,
        CGRectZero,
        CGRectZero,
    };
}
`;

const mangledCasesOriginal = `
[NSDictionary dictionaryWithObjectsAndKeys:[foo bar:@"]"], @"key", nil];
[[foo bar:foo[1]] objectForKey:key];
`;

const mangledCasesMangled = `
@{[foo bar:@"]"], @"key", };
[[foo bar:foo1]][key];
`;

// const unhandledCases = `
// `;

suite("Extension Tests", () => {

    test("Modernize test strings", () => {
        const cases = {
            [testString]: testStringFixed,
            [mangledCasesOriginal]: mangledCasesMangled,
            // [unhandledCases]: unhandledCases
        };
        
        for (const [test, expectation] of Object.entries(cases)) {
            const cleaned = modernize(test);
            assert.strictEqual(cleaned, expectation);
        }
    });
});
