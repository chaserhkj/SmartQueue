import React from "react";
import {
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@material-ui/core";

const TAList = props => {
  return (
    <div>
      <List>
        {!(
          props.ta_s &&
          Array.isArray(props.ta_s) &&
          props.ta_s.length > 0
        ) && (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        )}

        {props.ta_s &&
          Array.isArray(props.ta_s) &&
          props.ta_s.length > 0 &&
          props.ta_s.map((u, i) => (
            <ListItem key={i}>
              <ListItemText
                primary={
                  u.name + " (uid: " + u.uid + ")"
                }
              />
            </ListItem>
          ))}
      </List>
    </div>
  );
};

export default TAList;
