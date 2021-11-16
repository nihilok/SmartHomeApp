import * as React from "react";
import classNames from "classnames";

interface Props {
  withinLimit: boolean;
  programOn: boolean;
}

export function ProgramArrow({ withinLimit, programOn }: Props) {
  return (
    <div
      className={classNames("arrow right", {
        "disabled-arrow": !programOn,
        "on-arrow": withinLimit,
      })}
    />
  );
}
