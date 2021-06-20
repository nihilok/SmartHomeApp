import React from 'react';
import {MenuButton} from './MenuButton';
import {Header} from "./Header";

const MenuScreen = () => {
    return (
        <>
            <Header text="smarthome.app" settings={'/config'}/>
            <div className="container flex-col-center">
                <nav className="Menu-buttons grid-3">
                    <MenuButton
                        route="/heating"
                        icon="fire-alt"/>
                    <MenuButton
                        route="/tasks"
                        icon="tasks"/>
                    <MenuButton
                        route="/shopping"
                        icon="shopping-cart"/>
                    <MenuButton
                        route="/map"
                        icon="route"/>
                    <MenuButton
                        route="/cam"
                        icon="video"/>
                    <MenuButton
                        route="/recipes"
                        icon="pizza-slice"/>
                  <div style={{
                    marginTop: '7rem'
                  }}>
                    NEW >>>>>
                  </div>
                    <MenuButton
                        route="/planner"
                        icon="calendar-alt"/>
                  <div style={{
                    marginTop: '7rem'
                  }}>
                    {'<<<<< NEW'}
                  </div>
                </nav>
            </div>
        </>
    );
};

export default MenuScreen;