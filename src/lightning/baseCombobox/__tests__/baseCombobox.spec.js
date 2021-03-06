import { createElement } from 'lwc';
import Element from 'lightning/baseCombobox';
import exampleData from './../__mockData__/exampleBaseComboboxData';
import {
    shadowQuerySelector,
    shadowQuerySelectorAll,
} from 'lightning/testUtils';

expect.extend({
    toBeFocused(actual) {
        const pass = actual === document.activeElement;
        return {
            message: () =>
                `expected element to be ${pass ? 'NOT ' : ''}focused`,
            pass,
        };
    },
    toContainText(actual, expected) {
        const pass = actual.textContent.includes(expected);
        return {
            message: () =>
                `expected element's text \n\n "${actual.textContent}" \n\n to ${
                    pass ? 'NOT ' : ''
                }contain text ${expected}`,
            pass,
        };
    },
    toHaveSelectors(actual, expected) {
        const pass = shadowQuerySelectorAll(actual, expected).length >= 1;
        return {
            message: () =>
                `expected element ${
                    pass ? 'NOT ' : ''
                }to contain one or more selectors ${expected}`,
            pass,
        };
    },
});

const createComponent = (params = {}) => {
    const element = createElement('lightning-base-combobox', {
        is: Element,
    });
    element.inputId = 'uniqueId';
    Object.assign(element, params);
    document.body.appendChild(element);
    return element;
};

describe('lightning-base-combobox', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });
    describe('renders properly', () => {
        it('with items', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
            });
            expect(element).toMatchSnapshot();
        });

        it('renders correctly an "option-card" item with all attributes', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: [exampleData.exampleCardOptionAllAttributes],
            });
            shadowQuerySelector(element, 'input').click();
            return Promise.resolve().then(() => {
                jest.runAllTimers(); // to run raf
                expect(
                    shadowQuerySelector(element, '[role="option"]')
                ).toMatchSnapshot();
            });
        });

        it('can be disabled', () => {
            const element = createComponent({
                label: 'List Box Example',
                disabled: true,
            });
            expect(element).toMatchSnapshot();
        });

        it('with dropdown open', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
            });
            const input = shadowQuerySelector(element, 'input');
            input.value = 'Glo';
            input.click();
            return Promise.resolve().then(() => {
                jest.runAllTimers(); // to run raf
                expect(element).toMatchSnapshot();
            });
        });

        it('with maxlength', () => {
            const element = createComponent({
                label: 'List Box Example',
                inputMaxlength: '50',
            });
            expect(element).toMatchSnapshot();
            expect(element).toHaveSelectors('input[maxlength="50"]');
            expect(element).not.toHaveSelectors('input[maxlength="51"]');
        });

        it("with showSpinnerActivity, but only if it's set", () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
                showSpinnerActivity: true,
            });
            expect(element).toMatchSnapshot();
            element.showSpinnerActivity = false;
            return Promise.resolve().then(() => {
                expect(element).toMatchSnapshot();
            });
        });
    });

    describe('with empty items', () => {
        it('will not open empty dropdown', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: [],
            });
            const input = shadowQuerySelector(element, 'input');
            input.value = 'Glo';
            input.click();
            return Promise.resolve().then(() => {
                expect(element).toMatchSnapshot();
            });
        });

        it('will close dropdown when items become empty', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
            });
            const input = shadowQuerySelector(element, 'input');
            input.value = 'Glo';
            input.click();
            return Promise.resolve()
                .then(() => {
                    expect(
                        shadowQuerySelector(element, '.slds-is-open')
                    ).not.toBe(null);
                    element.items = [];
                })
                .then(() => {
                    expect(shadowQuerySelector(element, '.slds-is-open')).toBe(
                        null
                    );
                });
        });
    });

    describe('with a pill', () => {
        it('should render a pill when a pill is set', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
                inputPill: {
                    iconName: 'standard:account',
                    iconAlternativeText: 'Account',
                    label: 'Some Choice',
                },
            });
            expect(element).toMatchSnapshot();
        });

        it('should render a value for a pill', () => {
            const pillLabel = 'The Pill';
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
                inputPill: {
                    iconName: 'standard:account',
                    label: pillLabel,
                },
            });
            expect(shadowQuerySelector(element, 'input').value).toBe(pillLabel);
        });

        it('triggers pill remove event when a user removes a pill', () => {
            const onPillRemoveFunc = jest.fn();
            const element = createComponent({
                label: 'List Box Example',
                inputPill: {
                    iconName: 'standard:account',
                    label: 'Some Choice',
                },
            });

            element.addEventListener('pillremove', onPillRemoveFunc);
            expect(onPillRemoveFunc).not.toBeCalled();
            const button = shadowQuerySelector(element, 'button');
            button.click();
            return Promise.resolve().then(() => {
                expect(onPillRemoveFunc).toBeCalled();
            });
        });

        it('triggers pillremove when delete button on keyboard is pressed', () => {
            const onPillRemoveFunc = jest.fn();
            const element = createComponent({
                label: 'List Box Example',
                inputPill: {
                    iconName: 'standard:account',
                    label: 'Some Choice',
                },
            });

            element.addEventListener('pillremove', onPillRemoveFunc);
            expect(onPillRemoveFunc).not.toBeCalled();
            const event = new KeyboardEvent('keydown', { keyCode: 46 });
            const input = shadowQuerySelector(element, 'input');
            input.dispatchEvent(event);
            return Promise.resolve().then(() => {
                expect(onPillRemoveFunc).toBeCalled();
            });
        });

        it('renders a class name for the pill`s icon', () => {
            const element = createComponent({
                label: 'List Box Example',
                inputPill: {
                    label: 'Some Choice - icon presents',
                    iconName: 'standard:account',
                    iconAlternativeText: 'Account',
                },
            });
            return Promise.resolve()
                .then(() => {
                    expect(element).toHaveSelectors(
                        '.slds-input-has-icon_left-right'
                    );
                    expect(element).not.toHaveSelectors(
                        '.slds-input-has-icon_right'
                    );
                })
                .then(() => {
                    element.inputPill = {
                        label: 'Some Choice - but no icon this time',
                    };
                })
                .then(() => {
                    expect(element).not.toHaveSelectors(
                        '.slds-input-has-icon_left-right'
                    );
                    expect(element).toHaveSelectors(
                        '.slds-input-has-icon_right'
                    );
                });
        });
    });

    describe('is accessible', () => {
        it('renders aria-autocomplete="none" when variant "standard"', () => {
            const element = createComponent({
                label: 'List Box Example',
            });
            expect(element).toHaveSelectors('[aria-autocomplete="none"]');
        });

        it('renders aria-autocomplete="list" when variant "lookup"', () => {
            const element = createComponent({
                label: 'List Box Example',
                variant: 'lookup',
            });
            expect(element).toHaveSelectors('[aria-autocomplete="list"]');
        });

        it('renders alternative text for icon', () => {
            const element = createComponent({
                label: 'List Box Example',
                inputIconAlternativeText: 'Alternative Icon Text',
                items: exampleData.exampleItems,
                fieldLevelHelp: 'help help',
            });
            expect(element).toMatchSnapshot();
        });
    });

    describe('with items', () => {
        it('supports groups', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleGroups,
            });
            const input = shadowQuerySelector(element, 'input');
            input.value = 'Glo';
            input.click();
            return Promise.resolve().then(() => {
                jest.runAllTimers(); // to run raf
                // Snapshot match intended
                expect(element).toMatchSnapshot();
            });
        });

        it('renders correct amount of options, attaches ids', () => {
            const selectableItemsAmount = 9;
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleGroups,
            });
            const input = shadowQuerySelector(element, 'input');
            const id = input.id;
            input.value = 'Glo';
            input.click();
            return Promise.resolve().then(() => {
                const selectableOptions = shadowQuerySelectorAll(
                    element,
                    '[role="option"]'
                );
                const ids = [].slice
                    .call(selectableOptions)
                    .map(el => el.getAttribute('data-item-id'));
                expect(ids).toHaveLength(selectableItemsAmount);
                // Get the indexes as integers
                const indexes = ids.map(idString =>
                    parseInt(idString.replace(`${id}-`, ''), 10)
                );
                // Makes sure that the ids were generated properly by comparing the partial sum of them
                // If it fails, that means the IDs are not properly assigned to selectable items
                expect(
                    selectableItemsAmount * (selectableItemsAmount + 1) / 2
                ).toBe(
                    indexes.reduce((a, b) => a + b, 0) + selectableItemsAmount
                );
            });
        });
    });

    describe('highlights properly', () => {
        it('highlights first option when drop down is opened', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
            });
            const input = shadowQuerySelector(element, 'input');
            input.value = 'Glo';
            input.click();
            return Promise.resolve().then(() => {
                jest.runAllTimers(); // to run raf
                const items = shadowQuerySelectorAll(
                    element,
                    'lightning-base-combobox-item[role="option"]'
                );
                const selectedItem = shadowQuerySelector(
                    element,
                    '.slds-has-focus'
                );
                expect(items.indexOf(selectedItem)).toBe(0);
            });
        });

        it('highlights an option defined in items when dropdown is opened', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleDataWithHighlightedCard,
            });

            const input = shadowQuerySelector(element, 'input');
            input.value = 'Glo';
            input.click();
            return Promise.resolve().then(() => {
                jest.runAllTimers(); // to run raf
                const items = shadowQuerySelectorAll(
                    element,
                    'lightning-base-combobox-item[role="option"]'
                );

                const selectedItem = shadowQuerySelector(
                    element,
                    '.slds-has-focus'
                );
                expect(items.indexOf(selectedItem)).toBe(
                    exampleData.exampleDataWithHighlightedCard.findIndex(
                        e => e.highlight
                    )
                );
            });
        });
    });

    describe('triggers events', () => {
        it('triggers select event when an option is selected', () => {
            const onSelectFunc = jest.fn();
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
                onselect: onSelectFunc,
            });
            const input = shadowQuerySelector(element, 'input');
            input.click();
            return Promise.resolve().then(() => {
                shadowQuerySelector(
                    element,
                    'lightning-base-combobox-item'
                ).click();
                expect(onSelectFunc).toBeCalled();
            });
        });

        it('triggers open dropdown on keyboard input for standard variant', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
            });
            const event = new KeyboardEvent('keydown', { keyCode: 65 });
            const input = shadowQuerySelector(element, 'input');
            input.dispatchEvent(event);
            return Promise.resolve().then(() => {
                jest.runAllTimers(); // to run raf
                expect(element).toMatchSnapshot();
                expect(element).toHaveSelectors('.slds-is-open');
            });
        });

        it('opens dropdown on click for lookup variant', () => {
            const element = createComponent({
                variant: 'lookup',
                label: 'List Box Example',
                items: exampleData.exampleItems,
            });
            const input = shadowQuerySelector(element, 'input');
            input.click();
            return Promise.resolve().then(() => {
                expect(element).toHaveSelectors('.slds-is-open');
            });
        });

        it('triggers closing dropdown with escape key', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
            });
            const event = new KeyboardEvent('keydown', { keyCode: 65 });
            const escapeKeyPressed = new KeyboardEvent('keydown', {
                keyCode: 27,
            });
            const input = shadowQuerySelector(element, 'input');
            input.dispatchEvent(event);
            return Promise.resolve()
                .then(() => {
                    jest.runAllTimers(); // to run raf
                    expect(element).toMatchSnapshot();
                    input.dispatchEvent(escapeKeyPressed);
                })
                .then(() => {
                    expect(element).toMatchSnapshot();
                    expect(element).not.toHaveSelectors(
                        '.slds-combobox__input-entity-icon'
                    );
                });
        });

        it("doesn't trigger onselect event when input text is selected Ctrl+a", () => {
            const onInputTextSelect = jest.fn();
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
                inputText: 'Hello',
                onselect: onInputTextSelect,
            });
            expect(onInputTextSelect).not.toBeCalled();
            const input = shadowQuerySelector(element, 'input');
            input.select();

            return Promise.resolve().then(() => {
                expect(onInputTextSelect).not.toBeCalled();
            });
        });

        it('triggers scroll when user scrolled', () => {
            const onScroll = jest.fn();
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleDataManyRecords,
                inputText: 'Hello',
            });
            element.addEventListener('endreached', onScroll);
            const input = shadowQuerySelector(element, 'input');
            input.value = 'Glo';
            input.click();
            return Promise.resolve()
                .then(() => {
                    expect(onScroll).not.toBeCalled();
                    const listbox = shadowQuerySelector(
                        element,
                        '[role="listbox"]'
                    );
                    listbox.scrollTop = 50000;
                    listbox.dispatchEvent(
                        // eslint-disable-next-line lightning-global/no-custom-event-bubbling
                        new CustomEvent('scroll', {
                            composed: true,
                            bubbles: true,
                        })
                    );
                })
                .then(() => {
                    expect(onScroll).toBeCalled();
                });
        });

        it('triggers ontextchange event when the text input value changed', () => {
            const onTextChangeFunc = jest.fn();
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
            });
            element.addEventListener('textchange', onTextChangeFunc);
            const input = shadowQuerySelector(element, 'input');
            input.dispatchEvent(new Event('change'));

            return Promise.resolve().then(() => {
                expect(onTextChangeFunc).toBeCalled();
            });
        });
    });

    describe("properly handles 'value'", () => {
        it('binds value to inputText value', () => {
            const element = createComponent({
                label: 'List Box Example',
                items: exampleData.exampleItems,
                inputText: 'test value',
            });
            const input = shadowQuerySelector(element, 'input');
            expect(element.inputText).toBe(input.value);
        });
    });

    describe('passes aria attributes to input', () => {
        [
            undefined,
            {
                iconName: 'standard:account',
                iconAlternativeText: 'Account',
                label: 'Some Choice',
            },
        ].forEach(inputPill => {
            describe(inputPill ? 'with pill' : 'without pill', () => {
                [
                    {
                        cmpAriaName: 'inputControlsElement',
                        inputAriaName: 'aria-controls',
                    },
                    {
                        cmpAriaName: 'inputLabel',
                        inputAriaName: 'aria-label',
                    },
                    {
                        cmpAriaName: 'inputLabelledByElement',
                        inputAriaName: 'aria-labelledby',
                    },
                    {
                        cmpAriaName: 'inputDescribedByElements',
                        inputAriaName: 'aria-describedby',
                    },
                ].forEach(({ cmpAriaName, inputAriaName }) => {
                    it(inputAriaName, () => {
                        const ariaValue = 'list of stuff';
                        let ariaElement;
                        let element;
                        if (inputAriaName !== 'aria-label') {
                            ariaElement = document.createElement('div');
                            ariaElement.id = ariaValue;
                            element = createComponent({
                                [cmpAriaName]: ariaElement,
                                inputPill,
                            });
                        } else {
                            element = createComponent({
                                [cmpAriaName]: ariaValue,
                                inputPill,
                            });
                        }

                        return Promise.resolve().then(() => {
                            const input = shadowQuerySelector(element, 'input');
                            expect(input.getAttribute(inputAriaName)).toEqual(
                                expect.stringContaining(ariaValue)
                            );
                        });
                    });
                });
            });
        });
    });
});
