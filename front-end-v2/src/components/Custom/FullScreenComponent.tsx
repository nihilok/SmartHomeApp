import * as React from 'react';

export const FullScreenComponent: React.FC = ({children}) => {
    return (
        <div className="full-screen flex flex-col justify-center align-center">
            {children}
        </div>
    );
}