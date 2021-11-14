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
                route="/shopping"
                icon="shopping-cart"/>
            <MenuButton
                route="/tasks"
                icon="tasks"/>
            <MenuButton
                route="/planner"
                icon="calendar-alt"/>

            <MenuButton
                route="/map"
                icon="route"/>

            <MenuButton
                route="/heating"
                icon="fire-alt"/>
            <MenuButton
                route="/recipes"
                icon="pizza-slice"/>
            <MenuButton
                route="/baby"
                icon="baby"/>
            <MenuButton
                route="/cam"
                icon="video"/>

          </nav>
        </div>
      </>
  );
};

export default MenuScreen;