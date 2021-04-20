import * as React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Link} from "react-router-dom";


export const Header = ({text, back, settings}) => {
    return (
        <div className="w-screen mt-5" style={{
            height: '64px',
        }}>
            <div className="flex flex-row justify-between text-gray-300 w-full">
                {/*<div className="grid grid-cols-3 w-full mt-5">*/}
                <div className="text-left pl-5 text-3xl mr-auto min-w-full">
                    {back ?
                        <Link to="/"><FontAwesomeIcon icon="arrow-left" className="headerBtn"/></Link> : ''}</div>

                <div className="text-right pr-5 text-3xl ml-auto min-w-full">
                    {settings ?
                        <FontAwesomeIcon icon="cog" className="headerBtn"/>
                        : ''}
                </div>
                {/*</div>*/}
            </div>
            <div className="text-3xl font-semibold text-center w-max mx-auto relative" style={{
                position: "absolute",
                top: "24px",
                left: "50%",
                transform: "translateX(-50%)",
                color: "white",
            }}>
                {text}
            </div>
        </div>
    );
};
