/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { validateName } from '../../../../common/RegExp';
import { generalAPICall } from '../../../../apis/GeneralAPICall';
import SvgAF from '../../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../../common/IconLoader';
import FilePicker from '../FilePicker/FilePicker';
import './CreateSession.css';
import { standardErrorText } from '../../../../common/AlertMessage/AlertMessages';
import AlertMessage from '../../../../common/AlertMessage/AlertMessage';
import classnames from 'classnames';

export const CreateSession = (props) => {
    const textInput = React.createRef();
    const [gpkgName, setGPKGName] = useState('');
    const [gpkgContent, setGPKGContent] = useState([]);
    const [showValidationErr, setShowValidationErr] = useState(null);
    const [disable, setDisable] = useState(true);
    const [displayMode, setDisplayMode] = useState('GEOPACKAGE');
    const [inputValue, setInputValue] = useState('');
    const [showError, setShowError] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTheme, setAlertTheme] = useState('');
    const [cursorClass, setCursorClass] = useState('');
    const [validateAlertMessage, setValidateAlertMessage] = useState('');
    // setFileContent and setFileName used as props to get file contents from child component saved to appropriate file type
    const [fileContent, setFileContent] = useState([]);
    const [fileName, setFileName] = useState('');
    const [nearmapGo, setNearmapGo] = useState(null);
    const MAX_NEARMAP_DELAY_SECONDS = 30;
    const NEARMAP_DELAY_INTERVAL_SECONDS = 3;
    const MS_PER_SEC = 1000;
    const NEARMAP_DELAY_MS = NEARMAP_DELAY_INTERVAL_SECONDS * MS_PER_SEC;

    const setAlert = (message, theme, disable, cursor) => {
        setAlertMessage(message);
        setAlertTheme(theme);
        setShowError(true);
        setDisable(disable);
        setCursorClass(cursor);
    };
    const validationErrMessage = () => {
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
    };

    const setValidationAlert = (errorMessage) => {
        setShowValidationErr(true);
        setValidateAlertMessage(errorMessage);
        setDisable(false);
        setCursorClass('');
    };

    function validateSessionName(name) {
        if (validateName(name)) {
            props.setSessionName(name);
            if (validateAlertMessage) {
                setValidateAlertMessage('');
                setShowValidationErr(null);
            }
            return true;
        } else {
            return false;
        }
    }

    async function getSession(name) {
        const session = await generalAPICall('GET', name, '');

        if (session.status === 410) {
            return 'GONE';
        } else if (session.responseOk) {
            const sessionInfo = JSON.parse(session?.result);
            const sessionStates = sessionInfo?.states;
            if (sessionStates.includes('IDLE')) {
                return 'IDLE';
            }
            return 'NOT IDLE';
        } else {
            return 'ERROR';
        }
    }

    async function callCreateAPI(name) {
        const createResponse = await generalAPICall('PUT', name, {
            userId: props.username
        });

        if (createResponse.responseOk) {
            return true;
        } else {
            return false;
        }
    }

    async function startNearmap(name, numberTries) {
        const gpkgB64 = gpkgContent.split(',', 2)[1];
        const nearmapResult = await generalAPICall('POST', name + '/nearmap', { aoi: gpkgB64 });
        numberTries--;

        if (nearmapResult.status === 410 && numberTries > 0) {
            setTimeout(async () => {
                await startNearmap(name, numberTries);
            }, NEARMAP_DELAY_MS);
        } else if (nearmapResult.responseOk) {
            return props.setDisplayMode('IMPORT_SITE');
        } else {
            return setAlert(standardErrorText('initiate Nearmap processing'), 'is-error', false, '');
        }
    }

    const handleCreateSession = async () => {
        let sessionName = textInput.current.value;
        setDisable(true);
        setCursorClass('Global_Loading');

        if (showError) {
            setShowError(false);
        }

        const validationCheck = validateSessionName(sessionName);
        if (validationCheck) {
            const sessionCheck = await getSession(sessionName);
            if (sessionCheck === 'GONE') {
                setAlert('Session creation in progress, please stand by...', 'is-action', true, 'Global_Loading');
                const sessionExists = await callCreateAPI(sessionName);
                if (sessionExists) {
                    await startNearmap(sessionName, MAX_NEARMAP_DELAY_SECONDS / NEARMAP_DELAY_INTERVAL_SECONDS);
                } else {
                    setAlert(standardErrorText('create the Session'), 'is-error', false, '');
                }
            } else if (sessionCheck === 'IDLE') {
                await startNearmap(sessionName, MAX_NEARMAP_DELAY_SECONDS / NEARMAP_DELAY_INTERVAL_SECONDS);
            } else if (sessionCheck === 'NOT IDLE') {
                setValidationAlert('Session name must be unique. Please enter another name.');
            } else {
                setAlert(standardErrorText('check session status'), 'is-error', false, '');
            }
        } else {
            setValidationAlert(validationErrMessage());
        }
    };

    useEffect(() => {
        if (gpkgContent.length >= 1 && inputValue !== '') {
            setDisable(false);
        } else {
            setDisable(true);
        }
    }, [gpkgContent, inputValue]);

    const goBack = () => {
        props.setOpenModal(false);
    };

    const handleCancel = () => {
        props.setOpenModal(false);
        setShowError(null);
    };

    const checkUpload = () => {
        if (gpkgContent.length >= 1) {
            setAlert('Geopackage successfully uploaded.', 'is-action', false, '');
        }
    };

    useEffect(() => {
        checkUpload();
    }, [gpkgContent]);

    return (
        <div className={classnames(cursorClass)}>
            <div className='Global_Header_OuterDiv'>
                <SvgAF
                    img={IconLoader.icon_chevron_left_default}
                    hover={IconLoader.icon_chevron_left_hover}
                    onClick={goBack}
                />
                <h4 className='Global_Modal_BackIcon_Header'>Create a new session</h4>
            </div>
            <AlertMessage
                message={alertMessage}
                onClick={() => setShowError(false)}
                closeAlert={showError}
                theme={alertTheme}
                noIcon={alertTheme === 'is-action' ? true : false}
            />
            <div>
                <h6 className='Global_Subheader'>
                    Give a unique name for the session
                    <span className='CreateSession_Subheader_Span'> &#40;Required&#41;</span>
                </h6>
                <form className='Global_Form'>
                    <input
                        className='Global_InputField CreateSession_NameInput_withAlert'
                        type='text'
                        name='sessionName'
                        placeholder='Session name'
                        autoComplete='off'
                        onBlur={(e) => setInputValue(e.target.value)}
                        ref={textInput}
                        required
                        autoFocus
                    />
                </form>
                <div className='CreateSession_AlertDiv'>
                    {!showError && (
                        <AlertMessage
                            message={validateAlertMessage}
                            onClick={() => setShowValidationErr(false)}
                            closeAlert={showValidationErr}
                            theme='is-error'
                        />
                    )}
                </div>
                <FilePicker
                    extension='.gpkg'
                    isBinary={true}
                    icon={IconLoader.icon_upload_default}
                    hover={IconLoader.icon_upload_hover}
                    message='Upload an area of interest'
                    setFileName={setGPKGName}
                    setFileContent={setGPKGContent}
                />
                <div className='Global_FinishButtons_Div'>
                    <button className='Global_TertiaryButton' onClick={handleCancel}>
                        Cancel
                    </button>
                    <button disabled={disable} className='Global_PrimaryButton' onClick={handleCreateSession}>
                        Create Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateSession;
