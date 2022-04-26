// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React from 'react';
import './Footer.css';

const Footer = () => {
    const year = new Date().getFullYear();
    const buildString = process.env.REACT_APP_BUILD_VERSION_STRING

    return (
        <div className='Footer_OuterDiv'>
            <div>
                build: {buildString}
            </div>
            <div>
                Copyright &copy; {year} Pivotal Commware
            </div>
        </div>
    )
};

export default Footer;