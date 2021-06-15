import * as React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Link} from "react-router-dom";


export const Header = ({text, back, settings}) => {
    return (
        <div className="Header">
            <nav className="header-buttons flex-row-between container">
                {/*<div className="grid grid-cols-3 w-full mt-5">*/}
                <div className="flex-row-center">
                    {back ?
                        <Link to={back}><FontAwesomeIcon icon="arrow-left" className="headerBtn"/></Link> : ''}</div>

                <div className="flex-row-center">
                    {settings ?
                        <Link to={settings}><FontAwesomeIcon icon="cog" className="headerBtn"/></Link>
                        : ''}
                </div>
                {/*</div>*/}
            </nav>
            <div className="header-text">
                <h1>
                    {text}
                </h1>
            </div>
        </div>
    );
};
