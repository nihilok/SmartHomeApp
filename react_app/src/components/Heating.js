import React from 'react';
import {Header} from './Header';
import HeatingBlock from './HeatingBlock';


const Heating = () => {

    return (
        <>
            <Header text={'Central Heating'} back={'/'} settings={'/settings'}/>
            <div className="container flex-col-center">

                <HeatingBlock/>
            </div>
        </>
    );
};

export default Heating;