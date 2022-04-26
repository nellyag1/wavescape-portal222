// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

// * As of February 2022, Azure container and table restrictions are as follows:

// * Container must conform to these rules:
// * Name must be unique within the account.
// * Container names must start with a letter or number, and can contain only letters, numbers, and the dash (-) character.
// * Every dash (-) character must be immediately preceded and followed by a letter or number; consecutive dashes are not permitted in container names.
// * All letters in a container name must be lowercase.
// * Container names must be from 3 through 63 characters long.

// * Table names must conform to these rules:
// * Name must be unique within the account.
// * Table names must only be alphanumeric characters.
// * Table names cannot begin with a numeric character.
// * Letters in a table name are case-insensitive.
// * Table names must be from 3 through 63 characters long.
// * Some table names are reserved, including 'tables'. Attempting to create a table with a reserved table name returns error code 404 (Bad Request)

export const validateName = (name) => {
    const containerNameRegex = new RegExp('^(?=.{3,63}$)[a-z0-9]+(-[a-z0-9]+)*$');
    const tableNameRegex = new RegExp('^[A-Za-z][A-Za-z0-9]{2,62}$');

    if (containerNameRegex.test(name) && tableNameRegex.test(name) && name !== 'tables') {
        return true;
    } else {
        return false;
    }
};

// Must be a number (decimal allowed) from 0 to 360
export const threeSixtyRegex = new RegExp('^(360|360.0+|(3[0-5][0-9]|[12][0-9][0-9]|[0-9]{1,2})(\\.[0-9]+)?)$');

// Must be a number (decimal allowed) from 0 to 90
export const zeroToNinetyRegex = new RegExp('^(90|([0-8][0-9]|[0-9]{1})(\\.[0-9]+)?)$');

// Must be a number (decimal allowed)
export const onlyNumbersRegex = new RegExp('^[-+]?[0-9][0-9]*(\\.[0-9]+)?$');

// Must be a number (decimal allowed) from -90 to 90
export const latitudeRegex = new RegExp('^([-+]?((90(\\.0+)?)|([1-8]?[0-9])(\\.[0-9]+)?))$');

// Must be a number (decimal allowed) from -180 to 180
export const longitudeRegex = new RegExp(
    '^[+-]?(?:180(?:(?:\\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\\.[0-9]{1,6})?))$'
);

// Must be a number (decimal allowed) greater than 0
export const positiveNumRegex = new RegExp('^[0-9][0-9]*(\\.[0-9]+)?$');

// Number, letter, & underscore allowed
export const numAlphaUnderscore = new RegExp('^$|^[a-zA-Z0-9]([a-zA-Z0-9_])+$');
