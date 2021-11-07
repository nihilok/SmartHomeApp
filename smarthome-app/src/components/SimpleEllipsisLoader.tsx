import * as React from 'react';
import {useEffect} from "react";

interface Props {
    loading: boolean;
}

export function SimpleEllipsisLoader({loading}: Props) {

    const [state, setState] = React.useState('')

    useEffect(() => {
        let counter = 0;

        function cycleEllipsis() {
            let ellipsis = ''
            for (let i = 0; i < counter; i++) {
                ellipsis += '.'
            }
            setState(ellipsis)
            if (counter <= 2)
                counter++
            else counter = 0
        }
        cycleEllipsis()
        let interval = setInterval(() => {
            cycleEllipsis()
        }, 200)
        return () => clearInterval(interval)
    }, [])

    if (loading) return <span>{state}</span>
    else return null
}