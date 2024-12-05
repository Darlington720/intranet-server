import React, { useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import { useSelector } from "react-redux";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { selectWidgets } from "../../../store/widgetsSlice";

const widgets = {
  ranges: {
    DY: "Today",
    DT: "Yesterday",
    DTM: "Tomorrow",
  },
  currentRange: "DT",
  data: {
    name: "Total Application Forms",
    count: {
      DY: 21,
      DT: 16,
      DTM: 19,
    },
    extra: {
      name: "Intake",
      count: {
        DY: 6,
        DT: "August",
        DTM: "-",
      },
    },
  },
  detail: "You can show some detailed information about this widget in here.",
};

function SummaryWidget() {
  const { data, ranges, currentRange: currentRangeDefault } = widgets;
  const [currentRange, setCurrentRange] = useState(currentRangeDefault);
  const [loading, setLoading] = useState(true);

  // Simulating data loading with a useEffect hook
  useEffect(() => {
    // You can make an API call or perform any asynchronous operation here
    // For simplicity, let's simulate loading for 2 seconds
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Cleanup the timeout to avoid memory leaks
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array ensures useEffect runs only once on mount

  function handleChangeRange(ev) {
    setCurrentRange(ev.target.value);
  }

  if (loading) {
    // Render skeleton loading state
    return (
      <Paper className="flex flex-col flex-auto shadow rounded-2xl overflow-hidden">
        <Skeleton variant="rectangular" height={180} animation="wave" />
      </Paper>
    );
  }

  return (
    <Paper className="flex flex-col flex-auto shadow rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-8 pt-12">
        <Select
          className="mx-16"
          classes={{ select: "py-0 flex items-center" }}
          value={currentRange}
          onChange={handleChangeRange}
          inputProps={{
            name: "currentRange",
          }}
          variant="filled"
          size="small"
        >
          {Object.entries(ranges).map(([key, n]) => {
            return (
              <MenuItem key={key} value={key}>
                {n}
              </MenuItem>
            );
          })}
        </Select>
        <IconButton aria-label="more" size="large">
          <FuseSvgIcon>heroicons-outline:dots-vertical</FuseSvgIcon>
        </IconButton>
      </div>
      <div className="text-center mt-8">
        <Typography className="text-7xl sm:text-8xl font-bold tracking-tight leading-none text-blue-500">
          {data.count[currentRange]}
        </Typography>
        <Typography className="text-lg font-medium text-blue-600 dark:text-blue-500">
          {data.name}
        </Typography>
      </div>
      <Typography
        className="flex items-baseline justify-center w-full mt-20 mb-24"
        color="text.secondary"
      >
        <span className="truncate">{data.extra.name}</span>:
        <b className="px-8">{data.extra.count[currentRange]}</b>
      </Typography>
    </Paper>
  );
}

export default SummaryWidget;
