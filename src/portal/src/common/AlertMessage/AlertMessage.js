// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React from 'react';
import { IconLoader } from '../IconLoader';
import SvgAF from '../SvgAF/SvgAF';
import classnames from 'classnames';
import './AlertMessage.css';

const AlertMessage = (props) => {
    const alertActiveClass = props.closeAlert === true ? 'is-active' : props.closeAlert === false ? 'not-active' : '';

    return (
        <div className={classnames('AlertMessage_Container', alertActiveClass)}>
            <div className={classnames('AlertMessage_InnerDiv', props.theme)}>
                <div className='AlertMessage_Text'>{props.message}</div>
                {!props.noIcon && (
                    <SvgAF
                        img={IconLoader.icon_close_window_mid}
                        hover={IconLoader.icon_close_window_mid_hover}
                        closeAlert={props.closeAlert}
                        alt={'close alert'}
                        onClick={props.onClick}
                    />
                )}
            </div>
        </div>
    );
};

export default AlertMessage;
