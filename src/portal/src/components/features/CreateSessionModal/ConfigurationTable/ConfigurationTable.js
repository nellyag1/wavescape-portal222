/* eslint-disable array-callback-return, no-unused-vars, react-hooks/exhaustive-deps */
// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState, useMemo, useEffect } from 'react';
import SvgAF from '../../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../../common/IconLoader';
import ReactTooltip from 'react-tooltip';
import { useTable } from 'react-table';
import { useNavigate } from 'react-router-dom';
import { configurationJSON } from './ConfigurationJSON';
import { generalAPICall } from '../../../../apis/GeneralAPICall';
import AlertMessage from '../../../../common/AlertMessage/AlertMessage';
import { standardErrorText } from '../../../../common/AlertMessage/AlertMessages';
import classnames from 'classnames';
import './ConfigurationTable.css';

// attempts to parse value as float, if it cannot it returns the original value
const maybeParseFloat = (value) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        return value
    } else {
        return parsed
    }
}

const ConfigurationTable = (props) => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState(null);
    const [name, setName] = useState(null);
    const [newDefault, setNewDefault] = useState({});
    const [sessionConfigData, setSessionConfigData] = useState({});
    const [newConfigJSON, setNewConfigJSON] = useState('');
    const [showError, setShowError] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTheme, setAlertTheme] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [tableEntries, setTableEntries] = useState([]);
    const [reconfigurable, setReconfigurable] = useState([]);
    const [cursorClass, setCursorClass] = useState('');
    const [fromSessionDetails, setFromSessionDetails] = useState(props.setFromSessionDetails);
    const [disable, setDisable] = useState(false);
    const entries = [];
    const [next, setNext] = useState(false);
    const delayShowInMilliseconds = 150;

    const setAlert = (message, theme) => {
        setAlertMessage(message);
        setAlertTheme(theme);
        setShowError(true);
    };

    // check if session is configured, has failed the previous configuration, or has not been configured
    const checkIsConfigured = () => {
        if (
            props.setSessionData &&
            props.setSessionData.configuration !== '' &&
            !props.setSessionData.configuration.includes('[null,null]') &&
            !props.setSessionData.configuration.includes('{"data": {}, "site_spec": {}}')
        ) {
            setSessionConfigData(JSON.parse(props.setSessionData.configuration));
            setShowError(null);
            setIsConfigured(true);
            return true;
        } else if (
            props.setSessionData &&
            (props.setSessionData.configuration.includes('[null,null]') ||
                props.setSessionData.configuration === '{"data": {}, "site_spec": {}}')
        ) {
            setAlert(
                'There was a problem saving the previous configuration. Please configure the session again.',
                'is-action'
            );
            setIsConfigured(false);
            return false;
        } else {
            setShowError(null);
            setIsConfigured(false);
            return false;
        }
    };

    // gets the entries that will display in the UI and the entries that are enabled for reconfiguration
    const getShowEntries = () => {
        Object.entries(configurationJSON).forEach((object) => {
            Object.entries(object?.[1]).forEach((obj) => {
                obj && obj?.[1] && obj?.[1].show === true && entries.push(obj[0]);
                obj?.[1].reconfigurable && obj?.[1].reconfigurable === true && reconfigurable.push(obj[0]);
            });
        });
    };

    // saves the object descriptions from the hard coded JSON for using in reconfiguration when bringing in the session's config data from the API
    const getDescription = (name) => {
        let description = '';
        Object.entries(configurationJSON).forEach((object) => {
            Object.entries(object?.[1]).forEach((obj) => {
                if (obj && obj?.[1] && obj?.[1].show === true && obj?.[0] === name) {
                    description = obj?.[1].name;
                }
            });
        });
        return description;
    };

    // sets up the table data
    const data = useMemo(() => {
        const configured = checkIsConfigured();
        getShowEntries();

        // if session has been configured, it parses through the API configuration data and matches to the entries that will show in the UI
        if (configured) {
            Object.entries(JSON.parse(props.setSessionData.configuration)).forEach((object) => {
                Object.entries(object?.[1]).forEach((obj) => {
                    if (obj && obj?.[1] && entries.includes(obj?.[0])) {
                        tableEntries.push({
                            col1: obj?.[0],
                            col2: getDescription(obj?.[0]),
                            col3: obj?.[1],
                            col4: 'Input'
                        });
                    }
                });
            });

            // if session has not been configured, it parses through the hard coded configuration JSON
        } else {
            Object.entries(configurationJSON).forEach((object) => {
                Object.entries(object?.[1]).forEach((obj) => {
                    if (obj && obj?.[1] && obj?.[1].show === true) {
                        tableEntries.push({
                            col1: obj?.[0],
                            col2: obj?.[1].name,
                            col3: obj?.[1].value,
                            col4: 'Input'
                        });
                    }
                });
            });
        }
        return tableEntries;
    }, [tableEntries]);

    const columns = useMemo(
        () => [
            {
                Header: 'Name',
                accessor: 'col1'
            },
            {
                Header: 'Description',
                accessor: 'col2'
            },
            {
                Header: 'Default Value',
                accessor: 'col3'
            },
            {
                Header: 'New Value',
                accessor: 'col4'
            }
        ],
        []
    );

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

    const setValue = (e, name, value) => {
        e.preventDefault();
        setInputValue(value);
        setName(name);
    };

    const updateValue = (e, name, value) => {
        e.preventDefault();
        setShowError(null);
        const newFormData = { ...newDefault };

        // input values are set as new objects or as a new value
        if (name !== null && value !== '') {
            setNewDefault(newFormData);
            newFormData[name] = maybeParseFloat(value);

            // JSONs are updated with the new values and saved as a new configuration json to be passed in the POST API call
            if (isConfigured) {
                const newDataObject = Object.assign(
                    sessionConfigData?.data,
                    ...Object.entries(sessionConfigData?.data).map((obj) =>
                        obj[0] === name ? { [obj[0]]: newDefault[name] } : { [obj[0]]: obj[1] }
                    )
                );
                const newSitesObject = Object.assign(
                    sessionConfigData?.site_spec,
                    ...Object.entries(sessionConfigData?.site_spec).map((obj) =>
                        obj[0] === name ? { [obj[0]]: newDefault[name] } : { [obj[0]]: obj[1] }
                    )
                );
                const configJSON = {
                    data: newDataObject,
                    site_spec: newSitesObject
                };
                setSessionConfigData(configJSON);
                setNewConfigJSON(sessionConfigData);
            } else {
                configurationJSON &&
                    Object.entries(configurationJSON).forEach((object) => {
                        Object.entries(object?.[1]).forEach((obj) => {
                            let entryObj = obj?.[1];
                            if (obj?.[0] === name) {
                                entryObj.value = newFormData[name];
                            }
                        });
                    });
                setNewConfigJSON(parseJson(configurationJSON));
            }
        }
    };

    // hard coded JSON file gets saved as a key: value pair (vs key: object pair) for the POST API call
    const parseJson = (json) => {
        const newDataObject = Object.assign(
            {},
            ...Object.entries(json.data).map((obj) => ({ [obj[0]]: obj[1].value }))
        );
        const newSiteObject = Object.assign(
            {},
            ...Object.entries(json.site_spec).map((obj) => ({ [obj[0]]: obj[1].value }))
        );
        const configJSON = {
            data: newDataObject,
            site_spec: newSiteObject
        };
        return configJSON;
    };

    async function configureSession() {
        setCursorClass('Global_Loading');
        let sessionName = props.setSessionName;
        const configurationCall = await generalAPICall(
            'POST',
            sessionName + '/configure',
            newConfigJSON === '' ? parseJson(configurationJSON) : newConfigJSON
        );

        if (configurationCall.responseOk) {
            props.setOpenModal(false);
            setIsConfigured(true);
            navigate('/SessionDetails/' + sessionName);
            fromSessionDetails === true && (await props.handleCloseConfiguration());
        } else {
            setAlert(standardErrorText('configure the session'), 'is-error');
            setDisable(false);
            setCursorClass('');
        }
    }

    const handleNext = async () => {
        setNext(true);
        setDisable(true);
        await configureSession();
    };

    const handleCancel = () => {
        props.setOpenModal(false);
    };

    useEffect(() => {
        ReactTooltip.rebuild();
    });

    return (
        <div className={classnames(cursorClass)}>
            <div>
                {!isConfigured ? (
                    <h4 className='Global_Modal_Header'>Configuration</h4>
                ) : (
                    <h4 className='Global_Modal_Header'>Reconfiguration</h4>
                )}

                <AlertMessage
                    message={alertMessage}
                    onClick={() => setShowError(false)}
                    closeAlert={showError}
                    theme={alertTheme}
                />

                <p className='Global_Subheader'>
                    Session name: <span className='Global_Subheader_Span'>{props.setSessionName}</span>
                </p>
            </div>
            <form className='Global_Table_Container'>
                <table {...getTableProps()} className='Global_Table'>
                    <thead>
                        {headerGroups.map((headerGroup, index) => (
                            <tr key={index} {...headerGroup.getHeaderGroupProps()} className='Global_Table_tr-th'>
                                {headerGroup.headers.map((column, idx) => (
                                    <th key={idx} {...column.getHeaderProps()} className='Global_Table_tr-th'>
                                        {column.render('Header')}
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
                                                        ? 'Global_Table_td ConfigurationTable_td_col1'
                                                        : cell.column.id === 'col2'
                                                        ? 'Global_Table_td ConfigurationTable_td_col2'
                                                        : 'Global_Table_td ConfigurationTable_td'
                                                }
                                                {...cell.getCellProps()}
                                            >
                                                {cell.column.id !== 'col4' && cell.render('Cell')}
                                                {cell.column.id === 'col1' &&
                                                    configurationJSON &&
                                                    Object.entries(configurationJSON).map((object) => {
                                                        return Object.entries(object?.[1]).forEach((obj) => {
                                                            if (
                                                                obj?.[1]?.description !== '' &&
                                                                obj?.[0] === cell.row.values?.col1
                                                            ) {
                                                                let tooltipDesc = obj?.[1]?.description;
                                                                return (
                                                                    <div key={idx}>
                                                                        <SvgAF
                                                                            img={IconLoader.icon_info_default}
                                                                            hover={IconLoader.icon_info_hover}
                                                                            tooltip={tooltipDesc}
                                                                        />
                                                                        <div className='Global_Tooltip_Div'>
                                                                            <ReactTooltip
                                                                                type='info'
                                                                                effect='solid'
                                                                                className='Global_Tooltip'
                                                                                arrowColor='transparent'
                                                                                delayShow={delayShowInMilliseconds}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        });
                                                    })}

                                                {cell.column.id === 'col4' &&
                                                    isConfigured &&
                                                    JSON.parse(props.setSessionData.configuration) &&
                                                    Object.entries(JSON.parse(props.setSessionData.configuration)).map(
                                                        (object) => {
                                                            return Object.entries(object?.[1]).map((obj) => {
                                                                if (
                                                                    reconfigurable.includes(obj[0]) &&
                                                                    obj[0] === cell.row.values?.col1
                                                                ) {
                                                                    return (
                                                                        <input
                                                                            key={idx}
                                                                            className='Global_InputField Global_Table_InputField'
                                                                            onChange={(e) =>
                                                                                setValue(
                                                                                    e,
                                                                                    cell.row.values.col1,
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            onBlur={(e) =>
                                                                                updateValue(e, name, inputValue)
                                                                            }
                                                                        />
                                                                    );
                                                                }
                                                            });
                                                        }
                                                    )}
                                                {!isConfigured && cell.column.id === 'col4' && (
                                                    <input
                                                        className='Global_InputField Global_Table_InputField'
                                                        onChange={(e) =>
                                                            setValue(e, cell.row.values.col1, e.target.value)
                                                        }
                                                        onBlur={(e) => updateValue(e, name, inputValue)}
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </form>
            <div className='Global_FinishButtons_Div'>
                <button className='Global_TertiaryButton' onClick={handleCancel}>
                    Cancel
                </button>
                <button disabled={disable} className='Global_PrimaryButton' onClick={handleNext}>
                    Submit
                </button>
            </div>
        </div>
    );
};

export default ConfigurationTable;
