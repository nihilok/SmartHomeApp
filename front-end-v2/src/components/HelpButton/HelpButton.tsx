import * as React from "react";
import './help-button.css';
import {ClickAwayListener, IconButton} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {StyledTooltip} from "../Custom/StyledTooltip";

export function HelpButton() {
    const [open, setOpen] = React.useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };
  return (
      <ClickAwayListener onClickAway={handleTooltipClose}>
            <div>
              <StyledTooltip
                PopperProps={{
                  disablePortal: true,
                }}
                onClose={handleTooltipClose}
                open={open}
                disableFocusListener
                disableHoverListener
                disableTouchListener
                title="Long tap/hover on controls for help"
              >
                <IconButton onClick={handleTooltipOpen} className={'help-button'} color="primary" aria-label="help" component="div">
                    <HelpOutlineIcon />
                </IconButton>
              </StyledTooltip>
            </div>
          </ClickAwayListener>
  );
}
