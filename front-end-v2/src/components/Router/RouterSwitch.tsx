import { Route, Routes } from "react-router-dom";
import {MainMenu} from "../MainMenu";
import {ShoppingList} from "../ShoppingList/ShoppingList";

export default function RouterSwitch() {

  return (
    <Routes>
      <Route index element={<MainMenu />} />
      <Route path="*" element={<MainMenu />} />
      {/*<Route path="/login" element={<LoginForm redirect={"/"} />} />*/}
      <Route path="/shopping" element={<ShoppingList/>} />
    </Routes>
  );
}