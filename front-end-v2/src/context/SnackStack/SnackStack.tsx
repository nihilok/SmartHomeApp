import React from "react";
import SnackBar from "./SnackBar";
import "./SnackBar.module.css";
import { useSnackBarContext } from "../SnackBarContext";
import styles from './SnackBar.module.css'

const SnackStack = () => {
  const { context } = useSnackBarContext();

  React.useEffect(() => {
    let timeouts: Timeout[] = [];
    let timeCounter = 2500;
    let iterationCounter = 1;
    context.snackStack.forEach((snack, index) => {
      if (snack.ref.current) {
        timeouts.push(
          setTimeout(() => {
            snack.ref.current?.remove();
          }, timeCounter * iterationCounter)
        );
        iterationCounter++;
      }
    });
    return () => {
      timeouts.forEach((t) => {
        clearTimeout(t);
      });
    };
  }, [context.snackStack]);

  return (
    <div className={styles.SnackStack}>
      {context.snackStack.map((s, index) => (
        <SnackBar
          key={index + s.msg}
          ref={s.ref}
          msg={s.msg}
          options={s.options}
        />
      ))}
    </div>
  );
};

export default SnackStack;
