/**
 * Created by sebastianfuss on 26.02.17.
 */
import {browser, element, by, protractor, ElementFinder} from 'protractor';
import {Util as Closeness} from '../util';

xdescribe('Scroll Easing Functions', () => {

    beforeEach(() => {
        browser.get('/simple');
        element(by.css('#debugCheckBox')).click();
    });

    function getScrollPos(): Promise<number> {
        return browser.driver.executeScript('return Math.round(window.pageYOffset);');
    }

    function extractScrollPosFromLogs(data: number[], positionPercentage: number): number {
        let positionFloored = Math.floor(data.length * positionPercentage);
        let positionedCeiled = Math.ceil(data.length * positionPercentage);
        return (data[positionFloored] + data[positionedCeiled]) / 2;
    }

    it('should scroll to seventh heading from button with linear easing', () => {
        let target: ElementFinder = element(by.css('#head7'));
        let trigger: ElementFinder = element(by.css('#testButton'));
        target.getLocation().then((headingLocation: any) => {
            getScrollPos().then((initialPos: number) => {
                expect(initialPos).toEqual(0);
                // Make sure the browser logs are empty so get them once (which automatically clears them)
                // Source: http://stackoverflow.com/a/30589885
                browser.manage().logs().get('browser').then(function () {
                    trigger.sendKeys(protractor.Key.ENTER).then(() => {
                        browser.sleep(5000).then(() => {
                            // At the end of the time the scrolling should be at the specific target position
                            getScrollPos().then((pos: number) => {
                                expect(pos).toBeCloseTo(headingLocation.y, Closeness.ofByOne);
                            });
                            // Inspect the console logs, they should contain all in between scroll positions
                            // Using the browser.sleep() to execute some code while the animation is running does not work
                            // consistently across browser, especially causing problems with the CI server
                            browser.manage().logs().get('browser').then(function (browserLog) {
                                let scrollPositionHistory = browserLog
                                    .filter(log => log.message.indexOf('Scroll Position: ') >= 0) // only take scroll position logs
                                    .map(log => parseInt(log.message.split(' ').reverse()[0], 10)); // parse scroll logs into ints

                                expect(scrollPositionHistory.length).toBeGreaterThan(0);
                                let linear25PercScrollPos = Math.round(headingLocation.y * 0.25) + scrollPositionHistory[0];
                                let linearHalfTimeScrollPos = Math.round(headingLocation.y / 2) + scrollPositionHistory[0];
                                let linear75PercScrollPos = Math.round(headingLocation.y * 0.75) + scrollPositionHistory[0];

                                // Allow a tolerance relative to the overall scroll distance (but a least 5 pixels absolute)
                                // A three percent tolerance is chosen. This may result due to different browser and system performance
                                let ofByThreePercent = Closeness.ofBy(Math.max(5, Math.ceil(headingLocation.y * 0.03)));

                                // Check that after a quarter of the total scroll time the scroll position is near
                                // a quarter of the total distance.
                                let scrollPosAfter25Perc = extractScrollPosFromLogs(scrollPositionHistory, 0.25);
                                expect(scrollPosAfter25Perc).toBeCloseTo(linear25PercScrollPos, ofByThreePercent);

                                // Check that after half of the total scroll time the scroll position is near
                                // half of the total distance
                                let scrollPosAfterHalfTime = extractScrollPosFromLogs(scrollPositionHistory, 0.5);
                                expect(scrollPosAfterHalfTime).toBeCloseTo(linearHalfTimeScrollPos, ofByThreePercent);

                                let scrollPosAfter75Perc = extractScrollPosFromLogs(scrollPositionHistory, 0.75);
                                expect(scrollPosAfter75Perc).toBeCloseTo(linear75PercScrollPos, ofByThreePercent);
                            });
                        });
                    });
                });
            });
        });
    });

    it('should scroll to seventh heading from button with custom easing', () => {
        let target: ElementFinder = element(by.css('#head7'));
        let trigger: ElementFinder = element(by.css('#customEasingButton'));
        let pageScrollDuration = 1250;
        target.getLocation().then((headingLocation: any) => {
            getScrollPos().then((initialPos: number) => {
                expect(initialPos).toEqual(0);
                // Make sure the browser logs are empty so get them once (which automatically clears them)
                // Source: http://stackoverflow.com/a/30589885
                browser.manage().logs().get('browser').then(function () {
                    trigger.sendKeys(protractor.Key.ENTER).then(() => {
                        browser.sleep(pageScrollDuration).then(() => {
                            // At the end of the time the scrolling should be at the specific target position
                            getScrollPos().then((pos: number) => {
                                expect(pos).toBeCloseTo(Math.round(headingLocation.y), Closeness.ofByOne);
                            });
                            // Inspect the console logs, they should contain all in between scroll positions
                            // Using the browser.sleep() to execute some code while the animation is running does not work
                            // consistently across browser, especially causing problems with the CI server
                            browser.manage().logs().get('browser').then(function (browserLog) {
                                let scrollPositionHistory = browserLog
                                    .filter(log => log.message.indexOf('Scroll Position: ') >= 0) // only take scroll position logs
                                    .map(log => parseInt(log.message.split(' ').reverse()[0], 10)); // parse scroll logs into ints

                                expect(scrollPositionHistory.length).toBeGreaterThan(0);
                                let linear25PercScrollPos = Math.round(headingLocation.y * 0.25) + scrollPositionHistory[0];
                                let linearHalfTimeScrollPos = Math.round(headingLocation.y / 2) + scrollPositionHistory[0];
                                let linear75PercScrollPos = Math.round(headingLocation.y * 0.75) + scrollPositionHistory[0];

                                // Check that after a quarter of the total scroll time the scroll position is less than
                                // a quarter of the total distance. This would be the case if linear scroll easing took place
                                let scrollPosAfter25Perc = extractScrollPosFromLogs(scrollPositionHistory, 0.25);
                                expect(scrollPosAfter25Perc).toBeLessThan(linear25PercScrollPos);

                                // Check that after half of the total scroll time the scroll position is greater than
                                // half of the total distance.
                                // Half time and half distance would be the case when linear easing took place
                                let scrollPosAfterHalfTime = extractScrollPosFromLogs(scrollPositionHistory, 0.5);
                                expect(scrollPosAfterHalfTime).toBeGreaterThan(linearHalfTimeScrollPos);

                                let scrollPosAfter75Perc = extractScrollPosFromLogs(scrollPositionHistory, 0.75);
                                expect(scrollPosAfter75Perc).toBeGreaterThan(linear75PercScrollPos);
                            });
                        });
                    });
                });
            });
        });
    });
});
