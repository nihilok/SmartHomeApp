import React from 'react';
import {MenuButton} from './MenuButton';
import {Header} from "./Header";

export const MenuScreen = () => {
    return (
        <><Header text="smarthome.app"/>
            <div className="flex justify-center items-center h-full">
                <div className="grid grid-cols-3 gap-10 px-5 w-full h-full">
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
                        route="/"
                        icon="money-bill-wave"/>
                </div>
            </div>
        </>
    );
};