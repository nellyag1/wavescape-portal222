// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

export const formatDate = (dateString) => {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        timeZone: 'UTC',
        timeZoneName: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options, 'en-US');
};

export const formatStates = (stateArr) => {
    let states = [];
    stateArr.forEach((state) => {
        let tempString = state.toLowerCase().replace(/_/g, ' ');
        let formattedString = tempString.charAt(0).toUpperCase() + tempString.slice(1);
        states.push(formattedString);
    });
    return states.join(', ');
};