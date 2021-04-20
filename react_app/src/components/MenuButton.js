import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import DelayLink from "./DelayLink";


export const MenuButton = ({icon, route}) => {
    return (
        <DelayLink to={route} delay={100} className="menuBtn">
            <FontAwesomeIcon icon={icon}/>
        </DelayLink>
    );
};
