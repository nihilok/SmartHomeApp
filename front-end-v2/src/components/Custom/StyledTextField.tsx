import { styled, TextField } from "@mui/material";
import { primary } from "../../constants/colors";

export const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: primary[50],
    },
    "&:hover:not(.Mui-disabled) fieldset": {
      borderColor: primary[300],
    },
  },
  "& label": {
    color: primary[50],
  },
  "& label.Mui-focused": {
    color: primary[500],
  },
});
