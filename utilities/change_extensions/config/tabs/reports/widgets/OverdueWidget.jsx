import React, { useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { memo } from "react";
import Skeleton from "@mui/material/Skeleton";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { selectWidgets } from "../../../store/widgetsSlice";

const widgets = {
  overdue: {
    title: "Unpaid Forms",
    data: {
      name: "Application Forms",
      count: 4,
      extra: {
        name: "Expected Fees",
        count: "200,000 UGX",
      },
    },
    detail: "You can show some detailed information about this widget in here.",
  },
};

function OverdueWidget() {
  const [loading, setLoading] = useState(true);
  // const widgets = useSelector(selectWidgets);
  const { title, data } = widgets.overdue;

  useEffect(() => {
    // Simulate loading for 2 seconds
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Cleanup the timeout to avoid memory leaks
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array ensures useEffect runs only once on mount

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
        <Typography
          className="px-16 text-lg font-medium tracking-tight leading-6 truncate"
          color="text.secondary"
        >
          {title}
        </Typography>
        <IconButton aria-label="more" size="large">
          <FuseSvgIcon>heroicons-outline:dots-vertical</FuseSvgIcon>
        </IconButton>
      </div>
      <div className="text-center mt-8">
        <Typography className="text-7xl sm:text-8xl font-bold tracking-tight leading-none text-red-500">
          {data.count}
        </Typography>
        <Typography className="text-lg font-medium text-red-600">
          {data.name}
        </Typography>
      </div>
      <Typography
        className="flex items-baseline justify-center w-full mt-20 mb-24"
        color="text.secondary"
      >
        <span className="truncate">{data.extra.name}</span>:
        <b className="px-8">{data.extra.count}</b>
      </Typography>
    </Paper>
  );
}

export default memo(OverdueWidget);
