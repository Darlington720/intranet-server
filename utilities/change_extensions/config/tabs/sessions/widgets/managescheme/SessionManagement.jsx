import Paper from "@mui/material/Paper";
import { motion } from "framer-motion";
import { lighten, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { memo, useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useSelector } from "react-redux";
import Tabs from "@mui/material/Tabs";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import FilledInput from "@mui/material/FilledInput";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import { styled } from "@mui/system";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Grid from "@mui/material/Grid";
import ViewScheme from "./ViewSchemes";
import Button from "@mui/material/Button";
// import { selectWidgets } from "../../../store/widgetsSlice";

const widgets = {
  taskDistribution: {
    ranges: {
      "this-week": "This Week",
      "last-week": "Last Week",
    },
    overview: {
      "this-week": {
        new: 594,
        completed: 287,
      },
      "last-week": {
        new: 526,
        completed: 260,
      },
    },
    labels: ["API", "Backend", "Frontend", "Issues"],
    series: {
      "this-week": [15, 20, 38, 27],
      "last-week": [19, 16, 42, 23],
    },
  },
};

function TaskDistributionWidget(props) {
  // const widgets = useSelector(selectWidgets);
  const { overview, series, labels, ranges } = widgets.taskDistribution;
  const [tabValue, setTabValue] = useState(0);
  const currentRange = Object.keys(ranges)[tabValue];
  const [awaitRender, setAwaitRender] = useState(true);

  const theme = useTheme();

  const chartOptions = {
    chart: {
      fontFamily: "inherit",
      foreColor: "inherit",
      height: "100%",
      type: "polarArea",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    labels,
    legend: {
      position: "bottom",
    },
    plotOptions: {
      polarArea: {
        spokes: {
          connectorColors: theme.palette.divider,
        },
        rings: {
          strokeColor: theme.palette.divider,
        },
      },
    },
    states: {
      hover: {
        filter: {
          type: "darken",
          value: 0.75,
        },
      },
    },
    stroke: {
      width: 2,
    },
    theme: {
      monochrome: {
        enabled: true,
        color: theme.palette.secondary.main,
        shadeIntensity: 0.75,
        shadeTo: "dark",
      },
    },
    tooltip: {
      followCursor: true,
      theme: "dark",
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary,
        },
      },
    },
  };

  const blue = {
    100: "#DAECFF",
    200: "#b6daff",
    400: "#3399FF",
    500: "#007FFF",
    600: "#0072E5",
    900: "#003A75",
  };

  const grey = {
    50: "#F3F6F9",
    100: "#E5EAF2",
    200: "#DAE2ED",
    300: "#C7D0DD",
    400: "#B0B8C4",
    500: "#9DA8B7",
    600: "#6B7A90",
    700: "#434D5B",
    800: "#303740",
    900: "#1C2025",
  };

  const Textarea = styled(TextareaAutosize)(
    ({ theme }) => `
    width: 100%;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 1.6rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 8px 12px;
    border-radius: 8px;
    color: ${theme.palette.mode === "dark" ? grey[300] : grey[900]};
    background: ${theme.palette.mode === "dark" ? grey[900] : "#fff"};
    border: 1px solid ${theme.palette.mode === "dark" ? grey[700] : grey[200]};
    box-shadow: 0px 2px 2px ${
      theme.palette.mode === "dark" ? grey[900] : grey[50]
    };

    &:hover {
      border-color: ${blue[400]};
    }

    &:focus {
      border-color: ${blue[400]};
      box-shadow: 0 0 0 3px ${
        theme.palette.mode === "dark" ? blue[600] : blue[200]
      };
    }

    // firefox
    &:focus-visible {
      outline: 0;
    }
  `
  );

  useEffect(() => {
    setAwaitRender(false);
  }, []);

  if (awaitRender) {
    return null;
  }
  const container = {
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <motion.div variants={item}>
          <Paper
            sx={{
              width: "100%",
              mb: 2,
              borderTopRightRadius: 0,
              borderTopLeftRadius: 0,
              display: "flex",
              flexDirection: "column",
            }}
            className="flex flex-col flex-auto p-24 shadow overflow-hidden h-full"
          >
            <Box
              component="form"
              sx={{
                "& > :not(style)": { m: 1 },
                flexGrow: 1, // Allow the form to grow and take up available space
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between", // Push the form items to the top and bottom
              }}
              noValidate
              autoComplete="off"
            >
              <FormControl variant="standard" fullWidth>
                <InputLabel htmlFor="component-simple">Session Name</InputLabel>
                <Input
                  id="component-simple"
                  placeholder="Session Name eg 2023-2024"
                />
              </FormControl>
              <Box sx={{ alignSelf: "flex-end" }}>
                {" "}
                {/* Align the box to the flex-end (right) */}
                <Button variant="contained">Save</Button>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Grid>

      <Grid item xs={8}>
        <motion.div variants={item}>
          <ViewScheme />
        </motion.div>
      </Grid>
    </Grid>
  );
}

export default memo(TaskDistributionWidget);
