import * as React from 'react';
import './main-menu.css'
import {Link} from 'react-router-dom';

export function MainMenu() {
    return (
        <div className={'main-menu'}>
            <Link to={'/heating'}>Heating</Link>
            <Link to={'/heating'}>Shopping List</Link>
            <Link to={'/heating'}>Tasks</Link>
            <Link to={'/heating'}>Camera</Link>
            <Link to={'/heating'}>Recipes</Link>
        </div>
    );
}