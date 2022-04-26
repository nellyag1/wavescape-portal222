// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React from 'react';
import SvgAF from '../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../common/IconLoader';
import './Navbar.css';

const Navbar = (props) => {
    let userName = props.username;

    return (
        <div className='Navbar_OuterDiv'>
            <SvgAF img={IconLoader.logo_WS_ignition_long} />
            <div className='Navbar_InnerDiv'>
                {/* Will add later if time permits and we get content from Brett
                <div className='Navbar_Item'>
                    <a>Support</a>
                </div> */}
                <div className='Navbar_Item'>
                    <p>Hello, {userName}</p>
                    <SvgAF img={IconLoader.icon_user_on} hover={IconLoader.icon_user_on} />
                </div>
            </div>
        </div>
    );
};

export default Navbar;
