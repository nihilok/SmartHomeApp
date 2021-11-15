import * as React from "react";
import "./help-button.css";
import { ClickAwayListener, IconButton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { StyledTooltip } from "../Custom/StyledTooltip";

interface Props {
  helpMode: boolean;
  setHelpMode: (state: boolean) => void;
}

export function HelpButton({ helpMode, setHelpMode }: Props) {
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    if (!helpMode)
      handleTooltipOpen()
    else handleTooltipClose() 
    setHelpMode(!helpMode);
  };

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
          <IconButton
            onClick={handleClick}
            className={"help-button"}
            color={helpMode ? "primary" : "default"}
            aria-label="help"
            component="div"
          >
            <HelpOutlineIcon />
          </IconButton>
        </StyledTooltip>
      </div>
    </ClickAwayListener>
  );
}
