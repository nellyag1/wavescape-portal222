/* eslint-disable no-unused-vars */
// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState } from 'react';
import './IterationModal.css';
import AlertMessage from '../../../../common/AlertMessage/AlertMessage';
import SvgAF from '../../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../../common/IconLoader';
import { validateName } from '../../../../common/RegExp';
import { standardErrorText, validationErrMessage } from '../../../../common/AlertMessage/AlertMessages';
import { generalAPICall } from '../../../../apis/GeneralAPICall';
import { stageJSON } from '../StageJSON';

const IterationModal = (props) => {
    const textInput = React.createRef();
    const [inputValue, setInputValue] = useState('');
    const [showError, setShowError] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [validateAlertMessage, setValidateAlertMessage] = useState('');
    const [showValidationErr, setShowValidationErr] = useState(null);

    const handleAction = async () => {
        let iterationName = textInput.current.value;
        const reducedData = Object.assign({}, ...Object.entries(stageJSON).map((obj) => ({ [obj[0]]: obj[1].value })));
        const apiBody = {
            iteration_name: iterationName,
            stages: Object.assign(reducedData, { calc_los: false, cov_geom: false })
        };

        if (validateName(iterationName) === true) {
            //Start API also being called in SessionDetails.js
            const startIterationCall = await generalAPICall('POST', props.sessionName + '/wavescape', apiBody);
            if (startIterationCall.responseOk) {
                props.setOpenModal(false);
                await props.handleCloseIteration();
            } else {
                setShowError(true);
                setAlertMessage(standardErrorText('start WaveScape'));
            }
        } else {
            setShowValidationErr(true);
            setValidateAlertMessage(validationErrMessage());
        }
    };

    const close = () => {
        props.setOpenModal(false);
    };

    return (
        <div>
            <div>
                <div className='Global_Header_OuterDiv'>
                    <h4 className='Global_Modal_Header'>Iteration Name</h4>
                </div>

                <AlertMessage
                    message={alertMessage}
                    onClick={() => setShowError(false, null)}
                    closeAlert={showError}
                    theme='is-error'
                />
                <div>
                    <h6 className='Global_Subheader'>
                        Please enter a name for your{' '}
                        <span className='IterationModal_Subheader_Name'>{props.sessionName}</span> iteration
                    </h6>
                    <form className='Global_Form'>
                        <input
                            className='Global_InputField CreateSession_NameInput_withAlert'
                            type='text'
                            name='iterationName'
                            placeholder='Iteration name'
                            autoComplete='off'
                            onBlur={(e) => setInputValue(e.target.value)}
                            ref={textInput}
                            required
                            autoFocus
                        />
                    </form>
                    {!showError && (
                        <AlertMessage
                            message={validateAlertMessage}
                            onClick={() => setShowValidationErr(false)}
                            closeAlert={showValidationErr}
                            theme='is-error'
                        />
                    )}
                </div>
                <div className='Global_FinishButtons_Div'>
                    <button className='Global_TertiaryButton' onClick={close}>
                        Cancel
                    </button>
                    <button className='Global_PrimaryButton' onClick={handleAction}>
                        Start WaveScape
                    </button>
                </div>
            </div>
        </div>
    );
};
export default IterationModal;
