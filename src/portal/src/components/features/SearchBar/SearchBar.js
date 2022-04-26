/* eslint-disable no-useless-rename */
// +----------------------------------------------------------------------------
// | Copyright (c) 2021 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React from 'react';
import SvgAF from '../../../common/SvgAF/SvgAF';
import { IconLoader } from '../../../common/IconLoader';
import './SearchBar.css';

const SearchBar = ({ input: keyword, onChange: setKeyword, placeholder: placeholder }) => {
    return (
        <div className='SearchBar_Container'>
            <div className='SearchBar_Input_Div'>
                <SvgAF img={IconLoader.icon_search_default} hover={IconLoader.icon_search_hover} />
                <input
                    value={keyword}
                    type='search'
                    placeholder={placeholder}
                    onChange={(e) => setKeyword(e.target.value)}
                />
            </div>
        </div>
    );
};
export default SearchBar;
