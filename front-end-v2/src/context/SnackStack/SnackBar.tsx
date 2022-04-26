import React from "react";
import "./SnackBar.module.css";
import { useSnackBarContext } from "../SnackBarContext";
import {SnackBoxProps} from "./types";
import classNames from 'classnames';
import styles from './SnackBar.module.css';

const SnackBar = React.memo(
  React.forwardRef(
    (
      { msg, options }: SnackBoxProps,
      ref: React.ForwardedRef<HTMLDivElement>
    ) => {
      const { context, dispatch: notify } = useSnackBarContext();
      const { delay, variant } = options || {};

      const currentId = `${context.snackStack.length}-snack`;

      React.useEffect(() => {
        let timeout = setTimeout(() => {
          const element = (ref as React.MutableRefObject<HTMLDivElement>)
            .current;
          if (!element) {
            return;
          }
          element.style.animation = "animateOff 500ms ease forwards";
        }, 2000);
        return () => clearTimeout(timeout);
      }, [ref]);

      React.useEffect(() => {
        let timeout = setTimeout(() => {
          notify(0);
        }, delay || 2500);
        return () => clearTimeout(timeout);
      }, [notify, delay, currentId]);

      return (
        <div
          className={classNames(styles.SnackBar, styles[`snack-bar-${variant}`])}
          ref={ref}
          id={currentId}
        >
          <p>{msg}</p>
        </div>
      );
    }
  )
);

export default SnackBar;
