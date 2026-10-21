import { bumpSort, isFloat, prettifyNumber, getPageTitle } from '../../lib/utils';


it('bumpSort returns a sorted copy with the bumped value first, leaving the input alone', () => {
    const groups = ['group B', 'control', 'group A'];

    expect(bumpSort(groups, 'control')).toEqual(['control', 'group A', 'group B']);
    expect(groups).toEqual(['group B', 'control', 'group A']);
});

it('bumpSort returns a sorted copy when the value to bump is missing', () => {
    expect(bumpSort(['Germany', 'Brazil', 'India'], 'All')).toEqual(['Brazil', 'Germany', 'India']);
});

it('isFloat is true only for numbers with a fractional part', () => {
    expect(isFloat(3.14)).toBe(true);
    expect(isFloat(5)).toBe(false);
    expect(isFloat('3.14')).toBe(false);
    expect(isFloat(NaN)).toBe(false);
});

it('prettifyNumber adds thousands separators to integers', () => {
    expect(prettifyNumber(5)).toBe('5');
    expect(prettifyNumber(5000000)).toBe('5,000,000');
});

it('prettifyNumber gives floats exactly VITE_VALUE_DECIMAL_PLACES (3) decimal places', () => {
    expect(prettifyNumber(3.2)).toBe('3.200');
    expect(prettifyNumber(1234.56789)).toBe('1,234.568');
});

it('getPageTitle appends the site title to a subtitle, or uses the site title alone', () => {
    expect(getPageTitle('Hardware')).toBe('Hardware | Firefox Public Data Report');
    expect(getPageTitle()).toBe('Firefox Public Data Report');
});
