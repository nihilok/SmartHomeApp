import * as React from 'react';
import {Link} from 'react-router-dom';

export function MainMenu() {
    return (
        <div className={'grid-3'}>
            <Link to={'/heating'}>Heating</Link>
            <Link to={'/heating'}>Shopping List</Link>
            <Link to={'/heating'}>Tasks</Link>
            <Link to={'/heating'}>Camera</Link>
            <Link to={'/heating'}>Recipes</Link>
        </div>
    );
}