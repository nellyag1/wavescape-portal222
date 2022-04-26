// +----------------------------------------------------------------------------
// | Copyright (c) 2022 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import Navbar from './components/features/Navbar/Navbar';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import SessionsTable from './components/features/SessionsTable/SessionsTable';
import SessionDetails from './components/features/SessionDetails/SessionDetails';
import { getUserInfo } from './apis/GetUserInfo';
import Footer from './components/features/Footer/Footer';
import PageNotFound from './components/PageNotFound/PageNotFound';
import Iterations from './components/features/Iterations/Iterations';
import './App.css';

function App() {
    const [userInfo, setUserInfo] = useState('');

    useEffect(() => {
        async function callGetUserAPI() {
            const user = await getUserInfo();
            setUserInfo(user.userDetails);
        }
        callGetUserAPI();
    }, []);

    return (
        <Router>
            <div className='App_Main'>
                <Navbar username={userInfo} />
                <Routes>
                    <Route path='/' element={<SessionsTable username={userInfo} />} />
                    <Route path='/SessionDetails/:sessionName' element={<SessionDetails />} />
                    <Route path='/SessionIteration/:sessionName' element={<Iterations />} />
                    <Route path='*' element={<PageNotFound />} />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
