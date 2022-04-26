// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState } from 'react';
import './ConfirmationModal.css';
import AlertMessage from '../../../../common/AlertMessage/AlertMessage';
import { standardErrorText } from '../../../../common/AlertMessage/AlertMessages';
import { generalAPICall } from '../../../../apis/GeneralAPICall';

const ConfirmationModal = (props) => {
    const [showError, setShowError] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTheme, setAlertTheme] = useState('');
    const action = props.request;
    const actionMessage =
        action === 'Stop'
            ? ' This action will stop any activities that are currently in progress. If nearmap is still running, once stopped the session will be unusable.'
            : '';

    const handleClose = () => {
        props.setOpenModal(false);
    };

    const setAlert = (message, theme) => {
        setAlertMessage(message);
        setAlertTheme(theme);
        setShowError(true);
    };

    const handleCloseAlert = async () => {
        setShowError(false);
    };

    async function postStopSession() {
        const postCall = await generalAPICall('POST', props.sessionName + '/stop', '');
        if (postCall.responseOk) {
            return console.log(postCall.responseOk);
        } else {
            setAlert(standardErrorText(action.toLowerCase() + ' activities in progress'), 'is-action');
        }
    }

    const handleConfirm = async () => {
        await postStopSession();
        await props.handleCloseConfirmation();
        props.setOpenModal(false);
    };

    return (
        <div>
            <div>
                <div>
                    <h4 className='Global_Modal_Header'>{action} Session</h4>
                </div>

                <AlertMessage
                    message={alertMessage}
                    onClick={handleCloseAlert}
                    closeAlert={showError}
                    theme={alertTheme}
                />

                <h6 className='Global_Subheader ConfirmationModal_Subheader'>
                    <div>
                        Are you sure you want to {action.toLowerCase()} session
                        <span className='Global_Subheader_Span_Bolder'> {props.sessionName}</span>?
                    </div>
                    <div className='ConfirmationModal_ActionMessage'>{actionMessage}</div>
                </h6>

                <div className='Global_FinishButtons_Div'>
                    <button className='Global_TertiaryButton' onClick={handleClose}>
                        Cancel
                    </button>
                    <button className='Global_PrimaryButton_Red' onClick={handleConfirm}>
                        Yes, {action} Session
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ConfirmationModal;
