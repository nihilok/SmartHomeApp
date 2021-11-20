import * as React from 'react';


export const TopBar: React.FC = ({children}) => {
    return (
        <div className={'top-bar'}>
            {children}
        </div>
    );
}