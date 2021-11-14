import * as React from 'react';
import { styled } from '@mui/material';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

export const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} placement="right-start" enterDelay={1000}/>
))({
  [`& .${tooltipClasses.tooltip}`]: {
  },
});