import React, {useState} from 'react';
import { Header } from './Header';
import { HeatingBlock, HeatingSettings } from './HeatingBlock';


export const Heating = () => {

    const [formHidden, setFormHidden] = useState(true)
    const showHideForm = (e) => {
        if (formHidden) {
            setFormHidden(false);
        } else {
            setFormHidden(true);
        }
    }

    return (
        <div className="h-full w-full">
            <Header text={'Central Heating'} back={true} />
            <hr className="mt-5"/>
            <div className="flex flex-col justify-center items-center h-full w-full overflow-y-auto">

            {formHidden ? <><HeatingBlock/>
                <button onClick={showHideForm} className="submitBtn">Settings</button>
            </> : <HeatingSettings setFormHidden={setFormHidden} />}
            </div>
        </div>
    );
};