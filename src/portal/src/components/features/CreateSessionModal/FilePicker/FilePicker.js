/* eslint-disable no-unused-vars */
// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState } from 'react';
import SvgAF from '../../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../../common/IconLoader';
import './FilePicker.css';

const FilePicker = (props) => {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [extension, setExtension] = useState(props.extension);
    const [isBinary, setIsBinary] = useState(props.isBinary);
    const [icon, setIcon] = useState(props.icon);
    const [hover, setHover] = useState(props.hover);

    const reader = new FileReader();
    reader.onload = () => {
        const result = reader.result;
        setContent(result);
        props.setFileContent(result);
    };

    const fileSelected = (e) => {
        const file = e.target.files[0];

        setName(file.name);
        props.setFileName(file.name);

        if (isBinary) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    };

    return (
        <div className='FilePicker_OuterDiv' onMouseEnter={() => setHover(hover)}>
            <label className={'Global_Large_Button'}>
                <input type='file' accept={extension} onChange={fileSelected} />
                <div className='Global_Large_Button_InnerDiv'>
                    <SvgAF img={icon} hover={hover} />
                    <p className='Global_Large_Button_Message'>{props.message}</p>
                </div>
            </label>
            {content && (
                <div className='FilePicker_FileName_Div'>
                    <SvgAF img={IconLoader.icon_success_default} />
                    <p className='FilePicker_FileName'>{name}</p>
                </div>
            )}
        </div>
    );
};

export default FilePicker;
