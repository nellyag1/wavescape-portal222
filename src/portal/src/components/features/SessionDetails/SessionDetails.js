/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps*/
// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState, useMemo, useEffect } from 'react';
import Modal from 'react-modal';
import { useTable } from 'react-table';
import './SessionDetails.css';
import SvgAF from '../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../common/IconLoader';
import { useNavigate, useParams } from 'react-router-dom';
import ConfigurationTable from '../CreateSessionModal/ConfigurationTable/ConfigurationTable';
import IterationModal from './IterationModal/IterationModal';
import { generalAPICall } from '../../../apis/GeneralAPICall';
import { stageJSON } from './StageJSON';
import { formatStates, formatDate } from '../../../common/HelperFunctions';
import AlertMessage from '../../../common/AlertMessage/AlertMessage';
import { standardErrorText } from '../../../common/AlertMessage/AlertMessages';
import LogsModal from './LogsModal/LogsModal';
import ReactTooltip from 'react-tooltip';
import ConfirmationModal from './ConfirmationModal/ConfirmationModal';

const SessionDetails = (props) => {
    const navigate = useNavigate();
    const PERIODIC_TIMER_30_SECONDS = 30 * 1000;
    const [modalIsOpen, setIsOpen] = useState(false);
    const [reconfigure, setReconfigure] = useState(false);
    const [iteration, setIteration] = useState(false);
    const [viewLogs, setViewLogs] = useState(false);
    const [logsType, setLogsType] = useState('');
    const [confirmation, setConfirmation] = useState(false);
    const [iterationStarted, setIterationStarted] = useState(false);
    const [displayMode, setDisplayMode] = useState(null);
    const [hover, setHover] = useState(false);
    const [waveScapeButtonCheck, setWaveScapeButtonCheck] = useState(true);
    const [validationButtonCheck, setValidationButtonCheck] = useState(true);
    const [disableStopButton, setDisableStopButton] = useState(false);
    const [sessionData, setSessionData] = useState('');
    const [date, setDate] = useState(new Date().toUTCString());
    const [showError, setShowError] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTheme, setAlertTheme] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [onAirLinkCheck, setOnAirLinkCheck] = useState(false);
    const [disable, setDisable] = useState(true);
    const [showLogs, setShowLogs] = useState(false);
    const delayShowInMilliseconds = 150;
    let { sessionName } = useParams();

    Modal.setAppElement('body');

    const setAlert = (message, theme) => {
        setAlertMessage(message);
        setAlertTheme(theme);
        setShowError(true);
    };

    useEffect(() => {
        ReactTooltip.rebuild();
    });

    async function getSession() {
        const getCall = await generalAPICall('GET', sessionName, '');
        if (getCall.responseOk) {
            return JSON.parse(getCall?.result);
        } else {
            setAlert(standardErrorText('retrieve session data'), 'is-action');
        }
    }

    // the Azure sites table does not exists until either Validation or WaveScape is run at least once
    const wavescapeOrValidationCheck = (status) => {
        if (status.includes('WAVESCAPE_COMPLETED') || status.includes('VALIDATION_COMPLETED')) {
            setDisable(false);
            setOnAirLinkCheck(true);
        }
    };

    const statusRunningCheck = (status) => {
        if (status.includes('READY_TO_RUN')) {
            !status.includes('VALIDATION_RUNNING') && setValidationButtonCheck(false);
            !status.includes('WAVESCAPE_RUNNING') && setWaveScapeButtonCheck(false);
        }
    };

    const statusStopCheck = (status) => {
        if (status.includes('STOPPED')) {
            setValidationButtonCheck(false);
            setWaveScapeButtonCheck(false);
            setDisableStopButton(true);
        }
    };

    const statusConfiguredCheck = (status) => {
        if (status.includes('CONFIGURATION_COMPLETED')) {
            setIsConfigured(true);
        }
    };

    const handleAllStatusChecks = (status) => {
        statusConfiguredCheck(status);
        statusRunningCheck(status);
        wavescapeOrValidationCheck(status);
        statusStopCheck(status);
    };

    const handleCloseAlert = async () => {
        const result = await getSession();
        const reset = await resetTable();
        result.states.includes('VALIDATION_COMPLETED') && setValidationButtonCheck(false);
        result.states.includes('WAVESCAPE_COMPLETED') && setWaveScapeButtonCheck(false);
        setShowError(false);
    };

    useEffect(() => {
        let useEffectRunning = true;

        (async () => {
            const result = await getSession();
            setSessionData(result);
            handleAllStatusChecks(result.states);
        })();

        return () => {
            useEffectRunning = false;
        };
    }, []);

    const resetTable = async () => {
        const result = await getSession();
        setSessionData(result);
        setDate(new Date().toUTCString());
        handleAllStatusChecks(result.states);
    };

    useEffect(() => {
        resetTable();
    }, []);

    useEffect(() => {
        let useEffectRunning = true;

        let periodicRefresh = setInterval(async () => {
            const result = await getSession();
            setSessionData(result);
            setDate(new Date().toUTCString());
            handleAllStatusChecks(result.states);
        }, PERIODIC_TIMER_30_SECONDS);

        return () => {
            useEffectRunning = false;
            clearInterval(periodicRefresh);
        };
    }, []);

    const handleLogsModal = (state) => {
        setViewLogs(true);
        setLogsType(state);
    };

    const completionMessage = (state) => {
        let executionInfo = '';
        let executionMessage = '';
        let checkCompletionState = sessionData?.states.includes(state.toUpperCase() + '_COMPLETED');
        let checkRunning = sessionData?.states.includes(state.toUpperCase() + '_RUNNING');
        let checkStopped = sessionData.states.includes('STOPPED');
        let result = 'running';

        if (sessionData?.[state.toLowerCase()].execution_info !== '') {
            executionInfo = JSON.parse(sessionData?.[state.toLowerCase()].execution_info);
            result = executionInfo.result._value_ === 'success' ? 'completed' : executionInfo.result._value_;

            if (result === 'failure') {
                executionMessage = executionInfo.failure_info.message
                    ? ': ' +
                      executionInfo.failure_info.message.charAt(0) +
                      executionInfo.failure_info.message.slice(1).toLowerCase()
                    : ': The task encountered a failure';
            } else if (result === 'completed') {
                executionMessage = ': The task ran successfully';
            } else {
                executionMessage = ': The task completed with an unknown result';
            }
            setShowLogs(true);
        }

        let message =
            executionInfo === '' || checkRunning
                ? ': Logs will be available once ' + state + ' is completed'
                : executionMessage;

        let logsStateIcon =
            !checkStopped && (result === 'running' || checkRunning)
                ? 'icon_progress'
                : result === 'completed' && !checkRunning
                ? 'icon_success_default'
                : result === 'failure' && !checkRunning
                ? 'icon_error_mid'
                : '';

        return (
            <div className='Global_Row_withIcon'>
                {(checkStopped || (!checkCompletionState && !checkRunning)) && state !== 'Nearmap' ? null : (
                    <SvgAF img={IconLoader?.[logsStateIcon]} />
                )}
                <div className='SessionDetails_LogsMessage' data-tip data-for={'logsStateMessage' + state}>
                    {checkStopped && state !== 'Nearmap'
                        ? 'Session stopped'
                        : !checkCompletionState && !checkRunning && state !== 'Nearmap'
                        ? ''
                        : state + ' ' + result + message}
                </div>
                <ReactTooltip
                    type='info'
                    effect='solid'
                    className='Global_Tooltip'
                    arrowColor='transparent'
                    id={'logsStateMessage' + state}
                    delayShow={delayShowInMilliseconds}
                >
                    {checkStopped && state !== 'Nearmap'
                        ? 'Session stopped'
                        : !checkCompletionState && !checkRunning && state !== 'Nearmap'
                        ? ''
                        : state + ' ' + result + message}
                </ReactTooltip>
            </div>
        );
    };

    const completionStateRow = (state) => {
        let checkCompletedState = sessionData.states.includes(state.toUpperCase() + '_COMPLETED');
        let checkRunningState = sessionData.states.includes(state.toUpperCase() + '_RUNNING');
        let checkNearmap = sessionData.states.includes('READY_TO_RUN');

        let row = {
            col1: state,
            col2: completionMessage(state),
            col3: ((state === 'Validation' && (checkCompletedState || (showLogs && !checkRunningState))) ||
                (state === 'WaveScape' && (checkCompletedState || (showLogs && !checkRunningState))) ||
                (state === 'Nearmap' && (checkNearmap || (showLogs && !checkRunningState)))) && (
                <div>
                    <button className='Global_Table_PrimaryButton' onClick={() => handleLogsModal(state)}>
                        View Logs
                    </button>
                </div>
            )
        };
        return row;
    };

    const handleConfirmationModal = () => {
        setConfirmation(true);
    };

    const handleCloseConfirmation = async () => {
        setDisableStopButton(true);
        await getSession();
        await resetTable();
        setWaveScapeButtonCheck(false);
        setValidationButtonCheck(false);
        setAlert('Session successfully stopped.', 'is-success');
    };

    /* TODO: Once a session is stopped a user can delete a session. 
        The 'Stop Session' button can be replaced by a 'Delete Session' button. Once
        a session is deleted, users would be taken to the Sessions Table page. 
    */
    const data = useMemo(() => {
        let logsStates = ['Nearmap', 'Validation', 'WaveScape'];
        let tableData = [];

        if (sessionData) {
            let status = {
                col1: 'Status',
                col2: formatStates(sessionData.states),
                col3: (
                    <button
                        className='Global_Table_SecondaryButton'
                        disabled={disableStopButton}
                        onClick={handleConfirmationModal}
                    >
                        <div>Stop Session</div>
                    </button>
                )
            };
            let user = {
                col1: 'Created By',
                col2: sessionData.created_by
            };
            let lastModified = {
                col1: 'Last Modified',
                col2: formatDate(sessionData.updated)
            };
            tableData.push(status, user, lastModified);

            logsStates.forEach((state) => {
                if (
                    sessionData.hasOwnProperty(state.toLowerCase()) &&
                    sessionData?.[state.toLowerCase()].task_id !== ''
                ) {
                    let row = completionStateRow(state);
                    tableData.push(row);
                }
            });
            return tableData;
        } else {
            return [];
        }
    }, [sessionData]);

    const columns = useMemo(
        () => [
            {
                Header: '',
                accessor: 'col1'
            },
            {
                Header: 'Details',
                accessor: 'col2'
            },
            {
                Header: '',
                accessor: 'col3'
            }
        ],
        [sessionData]
    );

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

    const goBack = () => {
        navigate('/');
    };

    const reconfiguration = async () => {
        await getSession();
        setReconfigure(true);
        setDisplayMode('CONFIGURATION');
        setIsOpen(true);
    };

    const handleCloseIteration = async () => {
        await getSession();
        setWaveScapeButtonCheck(false);
        resetTable();
        setAlert('WaveScape successfully started.', 'is-success');
    };

    const runWaveScape = async () => {
        setWaveScapeButtonCheck(true);
        const result = await getSession();

        if (result.states.includes('WAVESCAPE_COMPLETED')) {
            setIteration(true);
        } else {
            const apiBody = {
                iteration_name: 'Initial',
                stages: Object.assign({}, ...Object.entries(stageJSON).map((obj) => ({ [obj[0]]: obj[1].value })))
            };

            //Start API also being called in IterationModal.js
            const startCall = await generalAPICall('POST', sessionName + '/wavescape', apiBody);
            if (startCall.responseOk) {
                setDisableStopButton(false);
                setAlert('WaveScape successfully started.', 'is-success');
            } else {
                setAlert(standardErrorText('start WaveScape'), 'is-error');
                setWaveScapeButtonCheck(false);
            }
        }
    };

    const runValidation = async () => {
        setValidationButtonCheck(true);
        const validateCall = await generalAPICall('POST', sessionName + '/validate', '');
        if (validateCall.responseOk) {
            setDisableStopButton(false);
            setAlert('Validation successfully started.', 'is-success');
        } else {
            setAlert(standardErrorText('validate the session'), 'is-error');
            setValidationButtonCheck(false);
        }
    };

    const handleCloseConfiguration = async () => {
        await getSession();
        await resetTable();
        setAlert('Session successfully configured.', 'is-success');
    };

    const editSites = () => {
        navigate('/SessionIteration/' + sessionName);
    };

    return (
        <div className='Global_Container'>
            <div className='Global_Header_Div'>
                <div className='Global_BackIcon_Header'>
                    <SvgAF
                        img={IconLoader.icon_chevron_left_default}
                        hover={IconLoader.icon_chevron_left_hover}
                        onClick={goBack}
                    />
                    <div className='Global_Title Global_Title_withBack'>Session Details</div>
                </div>
            </div>

            <AlertMessage message={alertMessage} onClick={handleCloseAlert} closeAlert={showError} theme={alertTheme} />

            <div className='Global_Table_OuterDiv_2col SessionDetails_OuterDiv_TopMargin'>
                <div className='Global_Table_Div_2col'>
                    <div className='Global_Table_Subheader_Div'>
                        <p className='Global_Subheader'>
                            Session name: <span className='Global_Subheader_Span'>{sessionData.name}</span>
                        </p>
                        <div className='SessionDetails_TopButtons_Div'>
                            {!isConfigured ? (
                                <button className='Global_SecondaryButton' onClick={reconfiguration}>
                                    Configure
                                </button>
                            ) : (
                                <button className='Global_SecondaryButton' onClick={reconfiguration}>
                                    Reconfigure
                                </button>
                            )}
                            <Modal
                                isOpen={reconfigure}
                                className='Global_Modal'
                                overlayClassName='ModalOverlay_Outer'
                                contentLabel='nameIteration'
                            >
                                <ConfigurationTable
                                    setDisplayMode={setDisplayMode}
                                    setOpenModal={setReconfigure}
                                    setSessionName={sessionData.name}
                                    setSessionData={sessionData}
                                    handleCloseConfiguration={handleCloseConfiguration}
                                    setFromSessionDetails={true}
                                />
                            </Modal>
                            <button className='Global_SecondaryButton' disabled={disable} onClick={editSites}>
                                Edit Sites
                            </button>
                        </div>
                    </div>

                    <table {...getTableProps()} className='Global_Table SessionDetails_Table_Border'>
                        <thead className='SessionDetails_thead'>
                            {headerGroups.map((headerGroup, index) => (
                                <tr key={index} {...headerGroup.getHeaderGroupProps()} className='SessionsTable_tr-th'>
                                    {headerGroup.headers.map((column, idx) => (
                                        <th key={idx} {...column.getHeaderProps()} className='SessionsTable_tr-th'>
                                            {column.id === 'col1' && column.render('Header')}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()}>
                            {rows.map((row, index) => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()} key={index}>
                                        {row.cells.map((cell, idx) => {
                                            return (
                                                <td
                                                    key={idx}
                                                    className={
                                                        cell.column.id === 'col1'
                                                            ? 'SessionDetails_td_col1_Custom'
                                                            : cell.column.id === 'col3'
                                                            ? 'Global_Table_td SessionDetails_td_col3_Width'
                                                            : 'Global_Table_td'
                                                    }
                                                    {...cell.getCellProps()}
                                                >
                                                    {cell.render('Cell')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className='Global_Data_TimeStamp' onClick={resetTable}>
                        <div>Last updated {date}</div>
                        <SvgAF img={IconLoader.icon_reset_default} hover={IconLoader.icon_reset_hover} />
                    </div>
                </div>
                <div className='Global_ListContainer Global_ListContainer_topMargin'>
                    <ul>
                        <li className='Global_ListItem'>
                            <a href={process.env.REACT_APP_APPLICATION_INSIGHTS_URL}>
                                <SvgAF img={IconLoader.icon_open_new} hover={IconLoader.icon_open_new_hover} />
                                View Logs via App Insights
                            </a>
                        </li>
                        <li className='Global_ListItem'>
                            <a href={sessionData?.storage?.direct_link_container}>
                                <SvgAF img={IconLoader.icon_open_new} hover={IconLoader.icon_open_new_hover} />
                                Storage Explorer
                            </a>
                        </li>
                        {onAirLinkCheck ? (
                            <li className='Global_ListItem'>
                                <a href={sessionData?.storage?.direct_link_table}>
                                    <SvgAF img={IconLoader.icon_open_new} hover={IconLoader.icon_open_new_hover} />
                                    OnAir Sites
                                </a>
                            </li>
                        ) : (
                            <li className='Global_ListItem Message'>
                                OnAir Sites is available after session validation or starting WaveScape.
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <div>
                <div className='SessionDetails_Large_Buttons'>
                    <div
                        className='Global_Large_Button_OuterDiv SessionDetails_Large_Button_Margin'
                        onMouseEnter={() => setHover(hover)}
                    >
                        <button
                            className='Global_Large_Button SessionDetails_Large_Button'
                            disabled={validationButtonCheck}
                        >
                            <div className='Global_Large_Button_InnerDiv' onClick={runValidation}>
                                <SvgAF img={IconLoader.icon_start} />
                                <p className='Global_Large_Button_Message'>
                                    Validate
                                    <span className='Validate_Subheader_Span'> &#40;Recommended but optional&#41;</span>
                                </p>
                            </div>
                        </button>
                    </div>
                    <div className='Global_Large_Button_OuterDiv' onMouseEnter={() => setHover(hover)}>
                        <button
                            className='Global_Large_Button SessionDetails_Large_Button'
                            disabled={waveScapeButtonCheck}
                        >
                            <div className='Global_Large_Button_InnerDiv' onClick={runWaveScape}>
                                <SvgAF img={IconLoader.icon_start} />
                                <p className='Global_Large_Button_Message'>Start WaveScape</p>
                            </div>
                        </button>
                    </div>
                    <Modal isOpen={iteration} className='Global_Modal' overlayClassName='Global_ModalOverlay'>
                        <IterationModal
                            setModalAction='Start WaveScape Iteration'
                            setOpenModal={setIteration}
                            sessionName={sessionData.name}
                            handleCloseIteration={handleCloseIteration}
                        />
                    </Modal>
                </div>
            </div>
            <Modal isOpen={viewLogs} className='Global_Modal' overlayClassName='Global_ModalOverlay'>
                <LogsModal
                    setOpenModal={setViewLogs}
                    sessionName={sessionData.name}
                    logsMessage={completionMessage}
                    request={logsType}
                />
            </Modal>

            {/* TODO: Confirmation is general to take in the 'Stop' and 'Delete' requests. */}
            <Modal isOpen={confirmation} className='Global_Modal' overlayClassName='Global_ModalOverlay'>
                <ConfirmationModal
                    setOpenModal={setConfirmation}
                    sessionName={sessionData.name}
                    request={'Stop'}
                    handleCloseConfirmation={handleCloseConfirmation}
                />
            </Modal>
        </div>
    );
};

export default SessionDetails;
