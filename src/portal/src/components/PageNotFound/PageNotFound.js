import { Link } from 'react-router-dom';
import './PageNotFound.css';

const PageNotFound = () => {
    return (
        <div className="PageNotFound_OuterDiv">
            <h4 className='Global_Title'>Page not found, return to <Link to='/'>WaveScape</Link> Ignition</h4>
        </div>
    );
};

export default PageNotFound;