import * as React from 'react';
import { styled } from '@mui/material';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import {primary} from "../../constants/colors";

interface Props extends TooltipProps {
  disabled?: boolean;
}

export const StyledTooltip = styled(({ className, ...props }: Props) => (
  props.disabled ? <>{props.children}</> : <Tooltip {...props} classes={{ popper: className }}/>
))({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: primary[900]
  },
});
