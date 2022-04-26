import * as React from 'react';
import styles from './Components.module.css'
import {Link} from "react-router-dom";



export function MenuItem ({link, name}: {link: string; name: string;}) {
  return <Link className={styles.MenuItem} to={link}>{name}</Link>
}

export function MainMenu() {
  return (
    <div className={styles.MainMenu}>
      <MenuItem link={'/shopping'} name={'Shopping List'}/>
      <MenuItem link={'#'} name={'Recipes'}/>
      <MenuItem link={'#'} name={'Tasks'}/>
    </div>
  );
};
