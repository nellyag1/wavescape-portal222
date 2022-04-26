// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

export function standardErrorText(action) {
    return 'Failed to ' + action + ', please wait a few minutes and try again. If the problem persists, please contact WaveScape support.';
}

export function validationErrMessage() {
    return (
        <div>
            <p>As per Azure container and table restrictions, a valid name must conform to these rules:</p>
            <ul>
                <li>Contains 3 to 63 characters</li>
                <li>Starts with a letter</li>
                <li>All letters must be lowercase</li>
                <li>Name can include letters and numbers</li>
                <li>Name must not contain '-'</li>
                <li>Name must not use reserved table names, including 'tables'</li>
            </ul>
        </div>
    );
}

export function duplicateError() {
    return 'Session name must be unique. Please enter another name.';
}
