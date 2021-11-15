import * as React from 'react';
import classNames from "classnames";

interface Props {
    flex?: boolean;
    column?: true;
    justifyContent?: 'start' | 'end' | 'center' | 'between' | 'evenly'
    alignItems?: 'start' | 'end' | 'center' | 'between' | 'evenly'
}

export function FullScreenComponent (props: Props, children: React.ReactChildren) {
    return (
        <div className={classNames({
            'flex': props.flex,
            'flex-col': props.column,
        })}>
            {children}
        </div>
    );
}