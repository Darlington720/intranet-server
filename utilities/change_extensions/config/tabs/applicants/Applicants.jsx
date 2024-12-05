import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import { purple } from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import FusePageSimple from "@fuse/core/FusePageSimple";
import Grid from "@mui/material/Grid";

import DemoHeader from "./shared-components/DemoHeader";
import DemoContent from "./shared-components/DemoContent";
import DemoSidebar from "./shared-components/DemoSidebar";

const container = {
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const Root = styled(FusePageSimple)(({ theme }) => ({
  "& .FusePageSimple-header": {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.divider,
    width: "100%",
    "& > .container": {
      maxWidth: "100%",
      height: "100%",
    },
  },
  "& .FusePageSimple-toolbar": {},
  "& .FusePageSimple-content": {},
  "& .FusePageSimple-sidebarHeader": {},
  "& .FusePageSimple-sidebarContent": {},
}));

const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(purple[500]),
  backgroundColor: "#4f46e6",
  "&:hover": {
    backgroundColor: "#4f46e6",
  },
}));

function Applicants() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isMobile);
  const [age, setAge] = React.useState("");
  const handleChange = (event) => {
    setAge(event.target.value);
  };

  useEffect(() => {
    setLeftSidebarOpen(!isMobile);
    setRightSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full"
        style={{
          height: "100%",
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Grid
            container
            rowSpacing={1}
            columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          >
            <Grid item xs={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="demo-simple-select-label">Acc Yr</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={age}
                  label="Age"
                  onChange={handleChange}
                >
                  <MenuItem value={10}>Ten</MenuItem>
                  <MenuItem value={20}>Twenty</MenuItem>
                  <MenuItem value={30}>Thirty</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="demo-simple-select-label">Scheme</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={age}
                  label="Age"
                  onChange={handleChange}
                >
                  <MenuItem value={10}>Ten</MenuItem>
                  <MenuItem value={20}>Twenty</MenuItem>
                  <MenuItem value={30}>Thirty</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="demo-simple-select-label">Intake</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={age}
                  label="Age"
                  onChange={handleChange}
                >
                  <MenuItem value={10}>Ten</MenuItem>
                  <MenuItem value={20}>Twenty</MenuItem>
                  <MenuItem value={30}>Thirty</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <ColorButton variant="contained">Load</ColorButton>
            </Grid>
          </Grid>
        </Box>
        <div className="mt-10">
          <Root
            header={
              <DemoHeader
                leftSidebarToggle={(ev) => {
                  setLeftSidebarOpen(!leftSidebarOpen);
                }}
                rightSidebarToggle={(ev) => {
                  setRightSidebarOpen(!rightSidebarOpen);
                }}
              />
            }
            content={<DemoContent />}
            leftSidebarOpen={leftSidebarOpen}
            leftSidebarOnClose={() => {
              setLeftSidebarOpen(false);
            }}
            leftSidebarContent={<DemoSidebar />}
            // rightSidebarOpen={rightSidebarOpen}
            // rightSidebarOnClose={() => {
            //   setRightSidebarOpen(false);
            // }}
            // rightSidebarContent={<DemoSidebar />}
            scroll="page"
          />
        </div>
      </motion.div>
    </>
  );
}

export default Applicants;
