/* eslint-disable react-hooks/exhaustive-deps */
// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import './LogsModal.css';
import AlertMessage from '../../../../common/AlertMessage/AlertMessage';
import { standardErrorText } from '../../../../common/AlertMessage/AlertMessages';
import { generalAPICall } from '../../../../apis/GeneralAPICall';
import classnames from 'classnames';

const LogsModal = (props) => {
    const tabs = ['stdout', 'stderr'];
    const [active, setActive] = useState(tabs[0]);
    const [hovered, setHovered] = useState('');
    const [showError, setShowError] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTheme, setAlertTheme] = useState('');
    const [stdout, setStdout] = useState('');
    const [stderr, setStderr] = useState('');

    const close = () => {
        props.setOpenModal(false);
    };

    const setAlert = (message, theme) => {
        setAlertMessage(message);
        setAlertTheme(theme);
        setShowError(true);
    };

    async function getLogs() {
        let request = props.request === 'Validation' ? 'Validate' : props.request;

        const getCall = await generalAPICall('GET', props.sessionName + '/' + request.toLowerCase());
        if (getCall.responseOk) {
            const result = JSON.parse(getCall?.result);
            setStdout(result.std_out);
            setStderr(result.std_err);
        } else {
            setAlert(standardErrorText('retrieve ' + props.request + ' log data'), 'is-action');
        }
    }

    const handleCloseAlert = async () => {
        setShowError(false);
    };

    useEffect(() => {
        (async () => {
            await getLogs();
        })();
    }, []);

    return (
        <div>
            <div>
                <div>
                    <h4 className='Global_Modal_Header'>{props.request} Logs</h4>
                </div>

                <AlertMessage
                    message={alertMessage}
                    onClick={handleCloseAlert}
                    closeAlert={showError}
                    theme={alertTheme}
                />

                <h6 className='Global_Subheader'>{props.logsMessage(props.request)}</h6>

                <div>
                    <div className='LogsModal_TabsGroup'>
                        {tabs.map((tab) => (
                            <div
                                className={classnames(
                                    'LogsModal_Tab',
                                    hovered === tab && active === tab
                                        ? 'is-activeHovered'
                                        : active === tab
                                        ? 'is-active'
                                        : hovered === tab
                                        ? 'is-hovered'
                                        : ''
                                )}
                                key={tab}
                                onMouseEnter={() => setHovered(tab)}
                                onMouseLeave={() => setHovered('')}
                                onClick={() => setActive(tab)}
                            >
                                {tab}
                            </div>
                        ))}
                    </div>
                    <div className='test'>
                        <pre>{active === 'stdout' ? `${stdout} ` : `${stderr}`}</pre>
                    </div>
                </div>
                <div className='Global_FinishButtons_Div'>
                    <button className='Global_TertiaryButton' onClick={close}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
export default LogsModal;
