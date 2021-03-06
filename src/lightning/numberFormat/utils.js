import { getLocale } from 'lightning/configProvider';

const POSSIBLE_OPTS = {
    style: true,
    currency: true,
    currencyDisplay: true,
    useGroup: true,
    minimumIntegerDigits: true,
    minimumFractionDigits: true,
    maximumFractionDigits: true,
    minimumSignificantDigits: true,
    maximumSignificantDigits: true,
};
const STYLE = {
    DECIMAL: 'decimal',
    CURRENCY: 'currency',
    PERCENT: 'percent',
};
const CURRENCY_DISPLAY = {
    CODE: 'code', // USD
    SYMBOL: 'symbol', // $
    NAME: 'name', // US Dollars
};
const SAFE_NUM_LENGTH = 15;

const numberFormatInstancesCache = {};

function getStringOfChar(char, amount) {
    return new Array(amount + 1).join(char);
}

function getGroupingCount(skeleton) {
    const match = skeleton.match(/,[#0]*\./);
    return match ? match[0].length - 2 : 0;
}

function getLocaleTag() {
    const locale = getLocale();
    const localeLanguage = locale.userLocaleLang;
    const localeCountry = locale.userLocaleCountry;

    if (!localeLanguage) {
        return locale.langLocale.replace(/_/g, '-');
    }

    return localeLanguage + (localeCountry ? '-' + localeCountry : '');
}

function getOptionsUniqueKey(options) {
    return Object.keys(options)
        .sort()
        .reduce((prev, optionName) => {
            if (POSSIBLE_OPTS[optionName]) {
                return prev + optionName + options[optionName] + '';
            }
            return prev;
        }, '');
}

function toNumber(value, defaultValue) {
    const number = parseInt(value, 10);
    if (isNaN(number)) {
        return defaultValue;
    }
    return number;
}

function getFractionPart(options) {
    const minimumDigits = toNumber(options.minimumFractionDigits, 0);
    const maximumDigits = Math.max(
        toNumber(options.maximumFractionDigits, 0),
        minimumDigits
    );

    return (
        '.' +
        new Array(minimumDigits + 1).join('0') +
        new Array(maximumDigits - minimumDigits + 1).join('#')
    );
}

function updateFractionPart(skeleton, options) {
    const fractionPart = getFractionPart(options);
    return fractionPart ? skeleton.replace(/\.(0|#)*/, fractionPart) : skeleton;
}

function updateCurrencySymbol(skeleton, currencyCode, options) {
    const symbol = String.fromCharCode(164);
    if (options.currencyDisplay === CURRENCY_DISPLAY.NAME) {
        // append the currency code at the end.
        return skeleton.replace(symbol, '') + currencyCode;
    }
    return skeleton.replace(symbol, currencyCode);
}

function updateIntegerPart(skeleton, options) {
    const minimumIntegerDigits = options.minimumIntegerDigits;
    const groupingCount = getGroupingCount(skeleton);
    if (!minimumIntegerDigits) {
        return skeleton;
    }
    if (minimumIntegerDigits <= groupingCount) {
        return skeleton.replace(
            /,[#0]*\./,
            ',' +
                getStringOfChar('#', groupingCount - minimumIntegerDigits) +
                getStringOfChar('0', minimumIntegerDigits) +
                '.'
        );
    }
    return skeleton.replace(
        /[#0]*\./,
        getStringOfChar('0', minimumIntegerDigits - groupingCount) +
            ',' +
            getStringOfChar('0', groupingCount) +
            '.'
    );
}

function getBestMatchCurrencySymbol(code, currencyDisplay) {
    if (!('Intl' in window)) {
        return code; // fail gracefully.
    }
    const opts = {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 0,
    };
    if (currencyDisplay) {
        opts.currencyDisplay = currencyDisplay;
    }
    const nf = getFromCache(opts);
    return nf.format(2).replace(/2/g, '');
}

function getCurrency(options) {
    const currencyDisplay = options.currencyDisplay || CURRENCY_DISPLAY.SYMBOL;
    if (
        currencyDisplay === CURRENCY_DISPLAY.SYMBOL ||
        currencyDisplay === CURRENCY_DISPLAY.NAME
    ) {
        return getBestMatchCurrencySymbol(options.currency, currencyDisplay);
    }
    return options.currency;
}

function getFromCache(options) {
    const optionsUniqueKey = getOptionsUniqueKey(options);
    let numberFormatInstance = numberFormatInstancesCache[optionsUniqueKey];
    if (numberFormatInstance) {
        return numberFormatInstance;
    }
    numberFormatInstance = new Intl.NumberFormat(getLocaleTag(), options);
    numberFormatInstancesCache[optionsUniqueKey] = numberFormatInstance;
    return numberFormatInstance;
}

function exceedsSafeLength(value, maxFractionDigits) {
    const str = value.toString();
    const intPart = str.split(getLocale().decimal)[0];
    return intPart.length + toNumber(maxFractionDigits, 0) >= SAFE_NUM_LENGTH;
}

function normalizedMinimumFractionDigits(options) {
    const fractionSkeleton = getFallbackFractionSkeleton(options.style);
    const fractionDigits = fractionSkeleton.replace(/[^0]/g, '');
    return fractionDigits.length;
}

function normalizedMaximumFractionDigits(options) {
    const fractionSkeleton = getFallbackFractionSkeleton(options.style);
    const fractionDigits = fractionSkeleton.replace(/[^0#]/g, '');
    return Math.max(options.minimumFractionDigits, fractionDigits.length);
}

function getFallbackFractionSkeleton(style) {
    const locale = getLocale();
    let styleFormat = 'numberFormat';
    if (style === STYLE.CURRENCY) {
        styleFormat = 'currencyFormat';
    } else if (style === STYLE.PERCENT) {
        styleFormat = 'percentFormat';
    }
    const format = locale[styleFormat].split(';')[0];
    return format.split('.')[1] || '';
}

function normalizeOptions(options) {
    const locale = getLocale();
    const normalizedOpts = Object.assign({}, options);
    normalizedOpts.currency = normalizedOpts.currency || locale.currencyCode;
    if (normalizedOpts.minimumFractionDigits === undefined) {
        normalizedOpts.minimumFractionDigits = normalizedMinimumFractionDigits(
            normalizedOpts
        );
    }
    if (
        normalizedOpts.maximumFractionDigits === undefined ||
        normalizedOpts.maximumFractionDigits <
            normalizedOpts.minimumFractionDigits
    ) {
        normalizedOpts.maximumFractionDigits = normalizedMaximumFractionDigits(
            normalizedOpts
        );
    }
    return normalizedOpts;
}

export default {
    exceedsSafeLength,
    getFromCache,
    getCurrency,
    normalizeOptions,
    updateIntegerPart,
    updateFractionPart,
    updateCurrencySymbol,
};
