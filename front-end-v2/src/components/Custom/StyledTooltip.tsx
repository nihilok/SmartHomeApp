import * as React from 'react';
import { styled } from '@mui/material';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import {primary} from "../../constants/colors";

export const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }}/>
))({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: primary[900]
  },
});