import { createTheme } from "@mui/material";
import { ThemeProvider } from "@mui/system";
import { FC } from "react";

const theme = createTheme({
  palette: {
    primary: { main: "#000000", contrastText: "#FF0000" },
    secondary: { main: "#FF0000" },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        inputProps: {
          style: { textAlign: "center" },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          padding: "16px 12px",
          fontWeight: "bold",
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  },
});

const withMuiTheme = (Component: FC) => (props: any) => {
  const { ...rest } = props;
  return (
    <ThemeProvider theme={theme}>
      <Component {...rest} />
    </ThemeProvider>
  );
};

export { withMuiTheme };
