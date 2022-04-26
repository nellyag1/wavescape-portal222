/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { generalAPICall } from '../../../../apis/GeneralAPICall';
import Dropdown from '../Dropdown/Dropdown';
import { convertToGeojson } from './geojson';
import SvgAF from '../../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../../common/IconLoader';
import ReactTooltip from 'react-tooltip';
import FilePicker from '../FilePicker/FilePicker';
import {
    threeSixtyRegex,
    zeroToNinetyRegex,
    onlyNumbersRegex,
    latitudeRegex,
    longitudeRegex,
    positiveNumRegex,
    numAlphaUnderscore
} from '../../../../common/RegExp';
import AlertMessage from '../../../../common/AlertMessage/AlertMessage';
import { standardErrorText } from '../../../../common/AlertMessage/AlertMessages';
import classnames from 'classnames';
import './ImportSite.css';

const ImportSite = (props) => {
    const initMapping = [
        {
            name: 'Azimuth',
            key: 'azimuth',
            description: 'Orientation of antenna boresight in Degrees (Clockwise from True North)',
            value: '',
            regex: threeSixtyRegex,
            message: 'Must be a number (decimal allowed) from 0 to 360'
        },
        {
            name: 'Antenna Beamwidth',
            key: 'ant_bw',
            description: 'Beamwidth of antenna in degrees',
            value: '',
            regex: threeSixtyRegex,
            message: 'Must be a number (decimal allowed) from 0 to 360'
        },
        {
            name: 'Downtilt',
            key: 'downtilt_deg',
            description: 'Degree shift in elevation orientation of antenna boresight',
            value: '',
            dropdownPosition: 'dropdown-top',
            regex: zeroToNinetyRegex,
            message: 'Must be a number (decimal allowed) from 0 to 90'
        },
        {
            name: 'EIRP',
            key: 'peak_tx_dbm',
            description: 'Equivalent Isotropic Radiated Power of transmitter, measured in Decibel Milliwatts',
            value: '',
            dropdownPosition: 'dropdown-top',
            regex: onlyNumbersRegex,
            message: 'Must be a number (decimal allowed)'
        },
        {
            name: 'Latitude',
            key: 'latitude',
            description: 'Latitude of transmitter, in decimal degrees',
            value: '',
            dropdownPosition: 'dropdown-top',
            regex: latitudeRegex,
            message: 'Must be a number (decimal allowed) from -90 to 90'
        },
        {
            name: 'Longitude',
            key: 'longitude',
            description: 'Longitude of transmitter, in decimal degrees',
            value: '',
            dropdownPosition: 'dropdown-top',
            regex: longitudeRegex,
            message: 'Must be a number (decimal allowed) from -180 to 180'
        },
        {
            name: 'Height',
            key: 'height_m',
            description: 'Height of transmitter, in meters',
            value: '',
            dropdownPosition: 'dropdown-top',
            regex: positiveNumRegex,
            message: 'Must be a number (decimal allowed) greater than 0'
        },
        {
            name: 'Antenna Pattern',
            key: 'ant_pattern',
            description:
                'Filename of antenna pattern to use, options are: pivot_wide, pivot_medium, pivot_narrow, gNB_90, gNB_60, gNB_120, or leave blank to use an antenna with fixed power over defined beamwidth',
            value: '',
            dropdownPosition: 'dropdown-top',
            regex: numAlphaUnderscore,
            message: 'Must be one of the valid names described in the tooltip, or blank'
        }
    ];
    const [csvName, setCSVName] = useState('');
    const [csvFileContent, setCsvFileContent] = useState('');
    const [headers, setHeaders] = useState([]);
    const [rows, setRows] = useState([]);
    const [fileUploaded, setFileUploaded] = useState(false);
    const [mapping, setMapping] = useState(initMapping);
    const [disable, setDisable] = useState(true);
    const [clickedNext, setClickedNext] = useState(false);
    const [showError, setShowError] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTheme, setAlertTheme] = useState('');
    const [cursorClass, setCursorClass] = useState('');
    const delayShowInMilliseconds = 150;

    const setAlert = (message, theme) => {
        setAlertMessage(message);
        setAlertTheme(theme);
        setShowError(true);
    };

    const handleNext = async () => {
        setDisable(true);
        setClickedNext(true);
        setCursorClass('Global_Loading');

        const geoJSON = convertToGeojson(mapping, headers, rows);
        const csvEncoded = Buffer.from(csvFileContent).toString('base64');
        const bodyObj = {
            raw: csvEncoded,
            processed: geoJSON
        };
        const sitesCall = await generalAPICall('PUT', props.setSessionName + '/sites', bodyObj);

        if (sitesCall.responseOk) {
            props.setDisplayMode('CONFIGURATION');
        } else {
            setAlert(standardErrorText('save sites data'), 'is-error');
            setCursorClass('');
        }
    };

    const handleCancel = () => {
        props.setOpenModal(false);
    };

    const updateDataValue = (name, value) => {
        const tempData = [...mapping];
        tempData.forEach((d) => {
            if (d.name === name) {
                d.value = value;
            }
        });
        setMapping(tempData);
    };

    // Come back and test since geoJSON changed
    const assignedArr = [];
    mapping.forEach((item) => {
        const assignedValue = Object.values(item.value);
        if (assignedValue) {
            assignedArr.push(assignedValue);
        }
    });

    const valueCheck = assignedArr.flat();

    useEffect(() => {
        if (!clickedNext || (clickedNext && showError) || showError !== null) {
            if (valueCheck.length === 8) {
                setDisable(false);
            } else {
                setDisable(true);
            }
        } else {
            setDisable(true);
        }
    }, [valueCheck]);

    useEffect(() => {
        onCsvLoad(csvFileContent);
    }, [fileUploaded]);

    useEffect(() => {
        ReactTooltip.rebuild();
    });

    const checkUpload = () => {
        if (csvFileContent.length >= 1) {
            setAlert('Sites successfully uploaded.', 'is-action');
        }
    };

    useEffect(() => {
        checkUpload();
    }, [csvFileContent]);

    const onCsvLoad = (content) => {
        setCsvFileContent(content);

        if (content === '') return;

        let lines = content.trim().split(/\r?\n/);
        let rows = lines.map((l) => l.split(','));
        let headers = rows[0];
        rows = rows.slice(1);

        setHeaders(headers);
        setRows(rows);
    };

    return (
        <div className={classnames(cursorClass)}>
            <div>
                <h4 className='Global_Modal_Header'>Import Site</h4>
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

            <FilePicker
                extension='.csv'
                isBinary={false}
                icon={IconLoader.icon_selectFile_default}
                hover={IconLoader.icon_selectFile_hover}
                message='Select a CSV file'
                setFileName={setCSVName}
                setFileContent={onCsvLoad}
                setFileUploaded={setFileUploaded}
            />
            {csvFileContent.length >= 1 && (
                <div className='ImportSite_OuterDiv'>
                    {mapping.map((attributes, index) => {
                        return (
                            <div key={index} className='ImportSite_Attribute_OuterDiv'>
                                <div className='ImportSite_Attribute_Wrapper'>
                                    <div className='ImportSite_Attribute_InnerDiv'>
                                        <p>{attributes.name}</p>
                                        <SvgAF
                                            img={IconLoader.icon_info_default}
                                            hover={IconLoader.icon_info_hover}
                                            tooltip={attributes.description}
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
                                    <div>
                                        <Dropdown
                                            name={attributes.name}
                                            options={headers}
                                            passUpdatedValue={updateDataValue}
                                            dropdownPosition={attributes.dropdownPosition}
                                            dropdownSelectList={valueCheck}
                                            regex={attributes.regex}
                                            setAlert={setAlert}
                                            message={attributes.message}
                                            alertTheme={alertTheme}
                                            setShowError={setShowError}
                                            showError={showError}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
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

export default ImportSite;
