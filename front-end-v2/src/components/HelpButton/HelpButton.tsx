import * as React from "react";
import './help-button.css';
import { IconButton, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

export function HelpButton() {
  return (
    <Tooltip title="Long tap/hover on controls for help">
      <IconButton className={'help-button'} color="primary" aria-label="help" component="div">
        <HelpOutlineIcon />
      </IconButton>
    </Tooltip>
  );
}
