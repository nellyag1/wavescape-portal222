// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

// The General is used to make all calls to the API
// callMethod - the HTTP method
// url = the part of the URL after …sessions/
// bodyObj = JavaScript object for the body (option)
// Returns: JavaScript object containing 'status' and 'result'

export async function generalAPICall(callMethod, url, bodyObj) {
    const uri = window.location.origin + '/api/sessions/' + url;
    const fetchInfo = {
        method: callMethod,
        body: null,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (bodyObj !== '') {
        fetchInfo.body = JSON.stringify(bodyObj);
    }

    const response = await fetch(uri, fetchInfo);
    // keep for debugging
    // console.log('response', response);

    const status = response.status;
    // keep for debugging
    // console.log('status', status);

    const result = await response.text();
    // keep for debugging
    // console.log('result', result);

    const responseOk = response.ok;
    // keep for debugging
    // console.log('responseOk', responseOk);

    return { status, result, responseOk };
}
