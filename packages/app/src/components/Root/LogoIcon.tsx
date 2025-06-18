import { makeStyles } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

const useStyles = makeStyles({
  svg: {
    width: 'auto',
    height: 30,
  },
  path: {
    fill: '#7df3e1',
  },
});

const LogoIcon = () => {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <svg
      className={classes.svg}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 337.46 337.46"
      fill={theme.palette.primary.main}
    >
      <title>Virgin Money</title>
      <path d="M168.73,0A168.73,168.73,0,1,0,337.46,168.73,168.73,168.73,0,0,0,168.73,0Zm-70.91,258.1V79.36H142.1V258.1Zm130.54,0V79.36h44.28V258.1Z" />
    </svg>
  );
};

export default LogoIcon;
