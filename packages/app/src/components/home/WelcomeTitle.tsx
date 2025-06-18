import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';
import { FC } from 'react';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
  },
  greeting: {
    fontWeight: 'bold',
    fontSize: '2rem',
    marginBottom: 8,
    lineHeight: '1.1em',
  },
  timeOfDay: {
    fontSize: '1.25rem',
    fontWeight: 500,
    // Updated to use theme's primary color - matches HeaderLabel styling
    color: theme.palette.text.primary,
  },
}));

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

// Get the day of the week
const getDayOfWeek = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

type WelcomeTitleProps = {
  displayName?: string;
};

const WelcomeTitle: FC<WelcomeTitleProps> = ({ displayName = 'Developer' }) => {
  const classes = useStyles();
  
  // Extract the first name from the display name
  const firstName = displayName?.split(' ')[0] || 'Developer';
  const timeOfDay = getTimeOfDay();
  const dayOfWeek = getDayOfWeek();

  return (
    <Grid container className={classes.container}>
      <Grid item xs={12}>
        <Typography variant="h4" className={classes.greeting}>
          Good {timeOfDay}, {firstName}!
        </Typography>
        <Typography variant="subtitle1" className={classes.timeOfDay}>
          Welcome to your developer portal - {dayOfWeek}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default WelcomeTitle;