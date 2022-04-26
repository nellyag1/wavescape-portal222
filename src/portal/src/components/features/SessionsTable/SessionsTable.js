/* eslint-disable array-callback-return, react-hooks/exhaustive-deps, no-unused-vars */
// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import ModalManager from '../CreateSessionModal/ModalManager';
import React, { useState, useMemo, useEffect } from 'react';
import Modal from 'react-modal';
import { useTable, useSortBy } from 'react-table';
import SearchBar from '../SearchBar/SearchBar';
import SvgAF from '../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../common/IconLoader';
import { useNavigate } from 'react-router-dom';
import { generalAPICall } from '../../../apis/GeneralAPICall';
import { formatDate, formatStates } from '../../../common/HelperFunctions';
import AlertMessage from '../../../common/AlertMessage/AlertMessage';
import { standardErrorText } from '../../../common/AlertMessage/AlertMessages';
import { reactPlugin, appInsights, withAITracking, SeverityLevel } from '../../../common/AppInsights';
import classnames from 'classnames';
import './SessionsTable.css';

const SessionsTable = (props) => {
    const searchRef = React.createRef();
    const navigate = useNavigate();
    const sessions = [];
    const users = [];
    const PERIODIC_TIMER_30_SECONDS = 30 * 1000;
    const [input, setInput] = useState('');
    const [sessionsResults, setSessionsResult] = useState(null);
    const [usersResults, setUsersResult] = useState(null);
    const [selectedSearchOption, setSelectedSearchOption] = useState('');
    const [displayDropdown, setDisplayDropdown] = useState(false);
    const [modalIsOpen, setIsOpen] = useState(false);
    const [rowId, setRowId] = useState(null);
    const [sessionsData, setSessionsData] = useState(null);
    const [showError, setShowError] = useState(null);
    const [date, setDate] = useState(new Date().toUTCString());
    const [disable, setDisable] = useState(true);
    const [hover, setHover] = useState(false);
    const rowHoveredClass = hover ? 'Global_Table_td_Link' : '';
    const [hoveredRow, setHoveredRow] = useState('');
    Modal.setAppElement('body');

    function openModal() {
        setIsOpen(true);
    }

    async function getAllSessions() {
        appInsights.trackTrace({ message: 'Getting data of all sessions', severityLevel: SeverityLevel.Information });
        const getAllCall = await generalAPICall('GET', '', '');
        setDisable(false);
        if (getAllCall.responseOk) {
            setShowError(null);
            const result = JSON.parse(getAllCall?.result);
            const logMessage = 'Retrieved data for ' + result.length + ' sessions';
            console.log(logMessage);
            appInsights.trackTrace({ message: logMessage, severityLevel: SeverityLevel.Information });
            return result;
        } else {
            setShowError(true);
        }
    }

    useEffect(() => {
        let useEffectRunning = true;

        (async () => {
            const result = await getAllSessions();
            setSessionsData(result);
        })();

        return () => {
            useEffectRunning = false;
        };
    }, []);

    useEffect(() => {
        let useEffectRunning = true;

        let periodicRefresh = setInterval(async () => {
            const result = await getAllSessions();
            setSessionsData(result);
            setDate(new Date().toUTCString());
        }, PERIODIC_TIMER_30_SECONDS);

        return () => {
            useEffectRunning = false;
            clearInterval(periodicRefresh);
        };
    }, []);

    const resetTable = async () => {
        const result = await getAllSessions();
        setSessionsData(result);
        setDate(new Date().toUTCString());
    };

    useEffect(() => {
        resetTable();
    }, []);

    const data = useMemo(() => {
        let sessionsDataArr = [];
        let defunctCount = 0;

        sessionsData &&
            Object.entries(sessionsData).forEach((obj) => {
                let session = obj?.[1];

                // If the length of the session's states array is 1
                // and the state is either IDLE, NEARMAP_RUNNING, or NEARMAP_COMPLETED,
                // then session creation failed, or exited unceremoniously, during the create model flow.
                // These are "zombie" sessions that need to be ignored because they are unusable.
                if (
                    !(
                        session.states.length === 1 &&
                        (session.states[0] === 'IDLE' ||
                            session.states[0] === 'NEARMAP_RUNNING' ||
                            session.states[0] === 'NEARMAP_COMPLETED')
                    )
                ) {
                    let sessionObj = {
                        col1: session.name,
                        col2: formatStates(session.states),
                        col3: session.created_by,
                        col4: formatDate(session.updated),
                        col5: ''
                    };
                    sessionsDataArr.push(sessionObj);
                } else {
                    // Zombie!
                    // TODO - Proactively delete these zombie sessions by calling the delete api.
                    defunctCount++;
                    const logMessage =
                        'defunct session detected: name="' + session.name + '", state=' + session.states[0];
                    console.log(logMessage);
                    appInsights.trackTrace({ message: logMessage, severityLevel: SeverityLevel.Warning });
                }
            });

        if (defunctCount > 0) {
            const logMessage = 'session table load ignored ' + defunctCount + ' sessions';
            console.log(logMessage);
            appInsights.trackTrace({ message: logMessage, severityLevel: SeverityLevel.Warning });
        }

        return sessionsDataArr;
    }, [sessionsData]);

    const columns = useMemo(
        () => [
            {
                Header: 'Session Name',
                accessor: 'col1'
            },
            {
                Header: 'Status',
                accessor: 'col2'
            },
            {
                Header: 'Created By',
                accessor: 'col3'
            },
            {
                Header: 'Last Modified',
                accessor: 'col4'
            },
            {
                Header: '',
                accessor: 'col5'
            }
        ],
        [sessionsData]
    );

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
        { columns, data, rowId, autoResetSortBy: false },
        useSortBy
    );

    const filter = (userInput) => {
        data.forEach((obj) => {
            sessions.push(obj.col1);
            if (users.length < 1 && !users.includes(obj.col3)) {
                users.push(obj.col3);
            }
        });

        const filteredSessions = sessions.filter((item) => {
            return item.toLowerCase().includes(userInput.toLowerCase());
        });

        const filteredUsers = users.filter((item) => {
            return item.toLowerCase().includes(userInput.toLowerCase());
        });

        if (userInput === '') {
            setInput('');
            setSessionsResult(null);
            setUsersResult(null);
            setSelectedSearchOption('');
            setDisplayDropdown(false);
        } else {
            setInput(userInput);
            if (input.length >= 2) {
                setSessionsResult(filteredSessions);
                setUsersResult(filteredUsers);
                setDisplayDropdown(true);
            }
        }
    };

    useEffect(() => {
        document.addEventListener('click', closeDropdown, true);
        return () => {
            document.removeEventListener('click', closeDropdown, true);
        };
    });

    const closeDropdown = (e) => {
        if (searchRef.current && !searchRef.current.contains(e.target)) {
            setDisplayDropdown(false);
            setInput('');
            if (selectedSearchOption !== '') {
                setInput(input);
            }
        }
    };

    const onOptionClicked = (value) => {
        setSelectedSearchOption(value);
        setInput(value);
        setDisplayDropdown(false);
    };

    const rowOutput = (row, index) => {
        return (
            <tr {...row.getRowProps()} key={index}>
                {row.cells.map((cell, idx) => {
                    return (
                        <td
                            key={idx}
                            onClick={() => navigate('/SessionDetails/' + row.values.col1)}
                            onMouseEnter={() => {
                                setHover(true);
                                setHoveredRow(row.id);
                            }}
                            onMouseLeave={() => setHover(false)}
                            className={classnames('Global_Table_td', row.id === hoveredRow ? rowHoveredClass : '')}
                            {...cell.getCellProps()}
                        >
                            {cell.render('Cell')}
                            {cell.column.id === 'col5' && <div className='Global_Table_Link'>View</div>}
                        </td>
                    );
                })}
            </tr>
        );
    };

    return (
        <div className={!disable ? 'SessionsTable_OuterDiv' : 'SessionsTable_OuterDiv Global_Loading'}>
            <div className='SessionsTable_Div'>
                <h4 className='Global_Title'>Sessions</h4>
                <div className='SessionsTable_NewSession_InnerDiv'>
                    <div className='SessionsTable_SearchBar_Div'>
                        <SearchBar
                            input={input}
                            onChange={filter}
                            data={data}
                            value={selectedSearchOption}
                            placeholder='Search by session or user'
                        />
                        <div
                            className='Global_DropDown_Container SessionsTable_DropDown_Container_TwoCol'
                            ref={searchRef}
                        >
                            {displayDropdown && (sessionsResults.length >= 1 || usersResults.length >= 1) && (
                                <div className='Global_Dropdown_ListContainer SessionsTable_DropDown_ListContainer_TwoCol'>
                                    <div>
                                        <p className='Global_Dropdown_ListLabel'>Session Name:</p>
                                        <ul className='Global_Dropdown_List'>
                                            {sessionsResults.length >= 1 &&
                                                sessionsResults.map((option, index) => (
                                                    <li
                                                        className='Global_Dropdown_ListItem'
                                                        onClick={() => onOptionClicked(option)}
                                                        key={index}
                                                    >
                                                        {option}
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className='Global_Dropdown_ListLabel'>Created By:</p>
                                        <ul className='Global_Dropdown_List'>
                                            {usersResults.length >= 1 &&
                                                usersResults.map((option, index) => (
                                                    <li
                                                        className='Global_Dropdown_ListItem'
                                                        onClick={() => onOptionClicked(option)}
                                                        key={index}
                                                    >
                                                        {option}
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        disabled={disable}
                        onClick={openModal}
                        className={
                            !disable
                                ? 'SessionsTable_CreateNewSession_Button'
                                : 'SessionsTable_CreateNewSession_Button_Disabled Global_Loading'
                        }
                    >
                        New Session
                    </button>
                </div>
                <Modal
                    isOpen={modalIsOpen}
                    className='Global_Modal'
                    overlayClassName='Global_ModalOverlay'
                    contentLabel='CreateNewSession'
                >
                    <ModalManager isOpen={setIsOpen} setDisplayMode={'GEOPACKAGE'} username={props.username} />
                </Modal>
            </div>

            <AlertMessage
                message={standardErrorText('load sessions')}
                onClick={() => setShowError(false)}
                closeAlert={showError}
                theme='is-action'
            />

            <div
                className={
                    !showError
                        ? 'Global_Table_Container Global_Table_Container_Height'
                        : 'Global_Table_Container Global_Table_Container_Height SessionTable_Div_AlertMessage'
                }
            >
                <table {...getTableProps()} className='Global_Table'>
                    <thead>
                        {headerGroups.map((headerGroup, index) => (
                            <tr key={index} {...headerGroup.getHeaderGroupProps()} className='Global_Table_tr-th'>
                                {headerGroup.headers.map((column, idx) => (
                                    <th
                                        key={idx}
                                        {...column.getHeaderProps(column.getSortByToggleProps())}
                                        className={
                                            column.id === 'col5'
                                                ? 'Global_Table_tr-th_GrayBorder'
                                                : column.id !== 'col5' && column.isSorted
                                                ? 'Global_Table_tr-th_isSorted'
                                                : 'Global_Table_tr-th'
                                        }
                                    >
                                        {column.id === 'col5' && column.render('Header')}

                                        {column.id !== 'col5' && (
                                            <div className='SessionsTable_tr-th_Div'>
                                                {column.render('Header')}
                                                <div className='Global_Icon_Div_40'>
                                                    <SvgAF
                                                        img={IconLoader.icon_sort_default}
                                                        hover={IconLoader.icon_sort_hover}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()} className='Global_Table_tbody'>
                        {rows.map((row, index) => {
                            const session = row.values.col1;
                            const user = row.values.col3;
                            prepareRow(row);

                            if (!sessionsResults && !usersResults) {
                                return rowOutput(row, index);
                            } else if (
                                selectedSearchOption === '' &&
                                (sessionsResults || usersResults) &&
                                (sessionsResults.includes(session) || usersResults.includes(user))
                            ) {
                                return rowOutput(row, index);
                            } else if (
                                selectedSearchOption !== '' &&
                                (sessionsResults || usersResults) &&
                                (selectedSearchOption === session || selectedSearchOption === user)
                            ) {
                                return rowOutput(row, index);
                            } else if (
                                (!sessionsResults.includes(session) || !usersResults.includes(user)) &&
                                sessionsResults.length < 1 &&
                                usersResults.length < 1
                            ) {
                                if (row.id === '0') {
                                    return (
                                        <tr>
                                            <td className='Global_Table_td' width='50%'>
                                                No results found
                                            </td>
                                        </tr>
                                    );
                                }
                            }
                        })}
                    </tbody>
                </table>
            </div>

            <div className='Global_Data_TimeStamp' onClick={resetTable}>
                <div>Last updated {date}</div>
                <SvgAF img={IconLoader.icon_reset_default} hover={IconLoader.icon_reset_hover} />
            </div>
        </div>
    );
};

export default withAITracking(reactPlugin, SessionsTable);
