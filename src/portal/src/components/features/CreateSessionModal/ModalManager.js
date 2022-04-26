// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useState } from 'react';
import ConfigurationTable from './ConfigurationTable/ConfigurationTable';
import CreateSession from './CreateSession/CreateSession';
import ImportSite from './ImportSite/ImportSite';

const ModalManager = (props) => {
    const [displayMode, setDisplayMode] = useState(props.setDisplayMode);
    const [sessionName, setSessionName] = useState('');

    return (
        <div>
            {displayMode === 'GEOPACKAGE' && (
                <CreateSession
                    setDisplayMode={setDisplayMode}
                    setOpenModal={props.isOpen}
                    setSessionName={setSessionName}
                    username={props.username}
                />
            )}

            {displayMode === 'IMPORT_SITE' && (
                <ImportSite setDisplayMode={setDisplayMode} setOpenModal={props.isOpen} setSessionName={sessionName} />
            )}

            {displayMode === 'CONFIGURATION' && (
                <ConfigurationTable
                    setDisplayMode={setDisplayMode}
                    setOpenModal={props.isOpen}
                    setSessionName={sessionName}
                    setFromSessionDetails={false}
                />
            )}
        </div>
    );
};

export default ModalManager;
