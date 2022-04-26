/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState, useMemo, useRef, useEffect, forwardRef } from 'react';
import { useTable, useRowSelect, useSortBy } from 'react-table';
import SvgAF from '../../../common/SvgAF/SvgAF';
import AlertMessage from '../../../common/AlertMessage/AlertMessage';
import { IconLoader } from '../../../common/IconLoader';
import { useNavigate, useParams } from 'react-router-dom';
import { generalAPICall } from '../../../apis/GeneralAPICall';
import { standardErrorText } from '../../../common/AlertMessage/AlertMessages';
import ReactTooltip from 'react-tooltip';
import './Iterations.css';

const Iterations = () => {
    const navigate = useNavigate();
    let { sessionName } = useParams();
    const [hovered, setHovered] = useState(false);
    const [changedRows, setChangedRows] = useState(new Set());
    const [tableEntries, setTableEntries] = useState([]);
    const [showError, setShowError] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTheme, setAlertTheme] = useState('');
    const [sessionData, setSessionData] = useState('');
    const delayShowInMilliseconds = 150;

    const setAlert = (message, theme) => {
        setAlertMessage(message);
        setAlertTheme(theme);
        setShowError(true);
    };

    const getSitesCall = async () => {
        const sitesCall = await generalAPICall('GET', sessionName + '/sites');

        if (sitesCall.responseOk) {
            return JSON.parse(sitesCall?.result);
        } else {
            setAlert(standardErrorText('retrieve sites data'), 'is-error');
        }
    };

    const getSessionDataCall = async () => {
        const sessionCall = await generalAPICall('GET', sessionName + '');
        if (sessionCall.responseOk) {
            return JSON.parse(sessionCall?.result);
        } else {
            setAlert(standardErrorText('retrieve session data'), 'is-error');
        }
    };

    useEffect(() => {
        let useEffectRunning = true;
        (async () => {
            const result = await getSitesCall();
            setTableEntries(result);

            const sessionData = await getSessionDataCall();
            setSessionData(sessionData);
        })();
        return () => {
            useEffectRunning = false;
        };
    }, []);

    const data = useMemo(() => {
        return [...tableEntries];
    }, [tableEntries]);

    const columns = useMemo(
        () => [
            {
                Header: 'Source Index',
                accessor: 'src_indx'
            },
            {
                Header: 'Azimuth',
                accessor: 'azimuth'
            },
            {
                Header: 'Antenna Beamwidth',
                accessor: 'ant_bw'
            },
            {
                Header: 'Downtilt',
                accessor: 'downtilt_deg'
            },
            {
                Header: 'EIRP (DBM)',
                accessor: 'peak_tx_dbm'
            },
            {
                Header: 'Antenna Pattern',
                accessor: 'ant_pattern'
            },
            {
                Header: 'Enable/Disable',
                accessor: 'enabled'
            }
        ],
        []
    );

    const ToggleSwitch = ({ rowIndex }) => {
        let checked = tableEntries[rowIndex].enabled;
        return (
            <label className='IterationsTable_Switch'>
                <input
                    type='checkbox'
                    defaultChecked={checked}
                    onChange={() => updateMyData(rowIndex, 'enabled', !checked)}
                />
                <span className='IterationsTable_Slider' />
            </label>
        );
    };

    const updateMyData = (rowIndex, columnId, value) => {
        setTableEntries((old) => {
            old[rowIndex][columnId] = value;
            return old;
        });
        setChangedRows((prev) => prev.add(rowIndex));
    };

    const EditableCell = ({ value: initialValue, row: { index }, column: { id }, updateMyData }) => {
        const [value, setValue] = useState(initialValue);

        const onChange = (e) => {
            setValue(e.target.value);
        };

        const onBlur = () => {
            updateMyData(index, id, value);
        };

        useEffect(() => {
            setValue(initialValue);
        }, [initialValue]);

        return (
            <input
                className='Global_InputField Global_Table_InputField'
                value={value}
                onChange={onChange}
                onBlur={onBlur}
            />
        );
    };

    const defaultColumn = {
        Cell: EditableCell
    };

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
        {
            columns,
            data,
            defaultColumn,
            autoResetSelectedRows: false,
            updateMyData,
            autoResetSortBy: false
        },
        useSortBy,
        useRowSelect
    );

    const goBack = () => {
        navigate('/SessionDetails/' + sessionName);
    };

    useEffect(() => {
        ReactTooltip.rebuild();
    });

    const addNewRow = () => {
        let rowIndex = tableEntries.length;
        let newRow = {
            src_indx: '',
            ant_bw: '',
            downtilt_deg: '',
            peak_tx_dbm: '',
            ant_pattern: '',
            enabled: true
        };
        setTableEntries((prevTableEntries) => [...prevTableEntries, newRow]);
        setChangedRows((prev) => prev.add(rowIndex));
    };

    const patchSitesCall = async (patchBody) => {
        const patchCall = await generalAPICall('PATCH', sessionName + '/sites', patchBody);

        if (patchCall.responseOk) {
            setAlert('Iteration changes saved successfully.', 'is-success');
        } else {
            setAlert(standardErrorText('save iteration changes'), 'is-error');
        }
    };

    const handleSave = () => {
        const newRows = [];
        const existingRows = [];
        changedRows.forEach((index) => {
            const row = tableEntries[index];
            if (row.RowKey === undefined) {
                newRows.push(row);
            } else {
                existingRows.push(row);
            }
        });

        const patchBodyContent = {
            rows: {
                updated: existingRows,
                new: newRows
            }
        };
        console.log(patchBodyContent);
        patchSitesCall(patchBodyContent);
    };

    return (
        <div className='Global_Container'>
            <div className='Global_Header_withSubheader_Div'>
                <div className='Global_BackIcon_Header'>
                    <SvgAF
                        img={IconLoader.icon_chevron_left_default}
                        hover={IconLoader.icon_chevron_left_hover}
                        onClick={goBack}
                    />
                    <div className='Global_Title Global_Title_withBack'>Iteration</div>
                </div>
            </div>
            <AlertMessage
                message={alertMessage}
                onClick={() => setShowError(false)}
                closeAlert={showError}
                theme={alertTheme}
            />
            <div className='Global_Table_OuterDiv_2col'>
                <div>
                    <div className='IterationTable_Subheader_Div'>
                        <p className='Global_Subheader'>
                            Session name: <span className='Global_Subheader_Span'>{sessionName}</span>
                        </p>
                        <button className='Global_SecondaryButton' onClick={handleSave}>
                            Save
                        </button>
                    </div>

                    <div className='Global_Table_Container IterationsTable_Container_Height'>
                        <table {...getTableProps()} className='Global_Table'>
                            <thead className='IterationTable_zIndex'>
                                {headerGroups.map((headerGroup, index) => (
                                    <tr
                                        key={index}
                                        {...headerGroup.getHeaderGroupProps()}
                                        className='Global_Table_tr-th'
                                    >
                                        {headerGroup.headers.map((column, idx) => (
                                            <th
                                                key={idx}
                                                {...column.getHeaderProps(column.getSortByToggleProps())}
                                                className={
                                                    column.isSorted
                                                        ? 'Global_Table_tr-th_isSorted'
                                                        : 'Global_Table_tr-th'
                                                }
                                            >
                                                {column.id === 'enabled' && column.render('Header')}
                                                {column.id !== 'enabled' && (
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
                                    prepareRow(row);
                                    return (
                                        <tr {...row.getRowProps()} key={index}>
                                            {row.cells.map((cell, idx) => {
                                                return (
                                                    <td key={idx} className='Global_Table_td' {...cell.getCellProps()}>
                                                        {cell.column.id !== 'enabled' && cell.render('Cell')}
                                                        {cell.column.id === 'enabled' && (
                                                            <div key={idx} data-tip data-for='toggleTooltip'>
                                                                <ToggleSwitch rowIndex={index} />
                                                                <div className='Global_Tooltip_Div'>
                                                                    <ReactTooltip
                                                                        id='toggleTooltip'
                                                                        type='info'
                                                                        effect='solid'
                                                                        className='Global_Tooltip'
                                                                        arrowColor='transparent'
                                                                        delayShow={delayShowInMilliseconds}
                                                                    >
                                                                        Include site
                                                                    </ReactTooltip>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <button
                        className='Global_TertiaryButton Global_Button_withIcon'
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        onClick={addNewRow}
                    >
                        <SvgAF
                            img={IconLoader.icon_add}
                            hover={IconLoader.icon_add_hover}
                            active={hovered ? IconLoader.icon_add_hover : null}
                        />
                        Add Row
                    </button>
                </div>

                <div className='Global_ListContainer Global_ListContainer_topMargin'>
                    <ul>
                        <li className='Global_ListItem'>
                            <a href={sessionData?.storage?.direct_link_container}>
                                <SvgAF img={IconLoader.icon_open_new} hover={IconLoader.icon_open_new_hover} />
                                Storage Explorer
                            </a>
                        </li>
                        <li className='Global_ListItem'>
                            <a href={sessionData?.storage?.direct_link_table}>
                                <SvgAF img={IconLoader.icon_open_new} hover={IconLoader.icon_open_new_hover} />
                                OnAir Sites
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Iterations;
