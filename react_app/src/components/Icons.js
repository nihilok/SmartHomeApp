import React from 'react';
import {FontAwesomeIcon as Fa} from "@fortawesome/react-fontawesome";
// import useLongPress from "../hooks/useLongPress";

const DeleteIcon = ({func, id, icon}) => {


    // const onLongPress = () => {
    //     func(id)
    // };
    //
    // const onClick = () => {
    //     console.log('click is triggered')
    // }
    //
    // const defaultOptions = {
    //     shouldPreventDefault: true,
    //     delay: 200,
    // };
    // const longPressEvent = useLongPress(onLongPress, onClick, defaultOptions);
    //

    return (
        <Fa onClick={() => {
            func(id)
        }} icon={icon} className="Delete-icon"/>
    );
}

export {DeleteIcon};