import React, { Suspense, useEffect, useState } from "react";
import FusePageSimple from "@fuse/core/FusePageSimple";
import { Link, Outlet, useLocation } from "react-router-dom";

import { purple } from "@mui/material/colors";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import FuseLoading from "@fuse/core/FuseLoading";
import FuseNavigation from "@fuse/core/FuseNavigation";
import Typography from "@mui/material/Typography";
import { useSelector } from "react-redux";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import FusePageCarded from "@fuse/core/FusePageCarded";

import { motion } from "framer-motion";
import { lighten, styled } from "@mui/material/styles";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";

import config from "../../assets/config.png";

import Report from "./tabs/reports/Reports";
import Settings from "./tabs/role/Role";
import Session from "./tabs/sessions/Session";
import Modules from "./tabs/modules/Modules";
import UserComponent from "./tabs/user/UserCompo";
import { useSuspenseQuery } from "@apollo/client";
import { GET_STAFF_MEMBERS } from "../../graphql/queries";
// import User from "./tabs/user/User";
const acc_yrs = [
  {
    value: "2023/2024",
    label: "2023/2024",
  },
  {
    value: "2023/2024",
    label: "2023/2024",
  },
  {
    value: "2023/2024",
    label: "2023/2024",
  },
  {
    value: "2023/2024",
    label: "2023/2024",
  },
];

const schemes = [
  {
    value: "1",
    label: "DIRECT ENTRY",
  },
  {
    value: "2",
    label: "MATURE ENTRY",
  },
  {
    value: "3",
    label: "POST GRADUATE",
  },
];

const intakes = [
  {
    value: "FEB",
    label: "FEBRUARY",
  },
  {
    value: "AUG",
    label: "AUGUST",
  },
];
const Root = styled(FusePageCarded)(({ theme }) => ({
  "& .FusePageCarded-header": {},
  "& .FusePageCarded-wrapper": {},
  "& .FusePageCarded-leftSidebar": {},
  "& .description": {
    fontSize: 20,
    marginBottom: 40,
  },
}));

const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(purple[500]),
  backgroundColor: "#4f46e6",
  "&:hover": {
    backgroundColor: "#4f46e6",
  },
}));

const checkAppExistence = (array, property, value) => {
  if (!array.length) {
    return false;
  }

  for (const obj of array) {
    if (obj[property] === value) {
      return true;
    }
  }

  return false;
};

const Config = React.memo(function Config() {
  const appExistsInTaskBar = useSelector((state) => state.appsSlice.exists);

  const [loading, setLoading] = useState(!appExistsInTaskBar ? true : false);
  const [selectedTab, setSelectedTab] = useState(0);
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const location = useLocation();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);

  const [acc_yr, setAccYr] = React.useState("");
  const [scheme, setScheme] = React.useState("");
  const [intake, setIntake] = React.useState("");
  const handleChange = (event) => {
    setAccYr(event.target.value);
  };
  const handleChangeScheme = (event) => {
    setScheme(event.target.value);
  };

  const handleChangeIntake = (event) => {
    setIntake(event.target.value);
  };

  useEffect(() => {
    setLeftSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setLeftSidebarOpen(false);
    }
  }, [location, isMobile]);

  function handleTabChange(event, value) {
    setSelectedTab(value);
  }

  // console.log("apps in taskbar", taskBarApps);
  useEffect(() => {
    // const exists = checkAppExistence(taskBarApps, "route", "admissions");

    if (!appExistsInTaskBar) {
      setLoading(true);
    }

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <>
      {loading ? (
        <FuseLoading logo={config} />
      ) : (
        <Suspense fallback={<FuseLoading logo={config} />}>
          <Box sx={{ flexGrow: 1 }}>
            <AppBar position="sticky">
              <Toolbar variant="dense">
                {/* <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton> */}
                <Typography variant="h6" color="inherit" component="div">
                  Configurations
                </Typography>

                <div className="hidden lg:flex h-32 mx-20" />

                <Tabs
                  value={selectedTab}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="inherit"
                  variant="scrollable"
                  scrollButtons={false}
                  className="-mx-4 min-h-40"
                  classes={{
                    indicator:
                      "flex justify-center bg-transparent w-full h-full",
                  }}
                  TabIndicatorProps={{
                    children: (
                      <Box
                        sx={{ bgcolor: "text.disabled" }}
                        className="w-full h-full rounded-full opacity-20"
                      />
                    ),
                  }}
                >
                  <Tab
                    className="text-16 font-semibold min-h-40 min-w-64 mx-4 px-12 "
                    disableRipple
                    label="Role Permission"
                  />
                  <Tab
                    className="text-16 font-semibold min-h-40 min-w-64 mx-4 px-12 "
                    disableRipple
                    label="Session"
                  />
                  <Tab
                    className="text-16 font-semibold min-h-40 min-w-64 mx-4 px-12 "
                    disableRipple
                    label="Modules"
                  />
                  <Tab
                    className="text-16 font-semibold min-h-40 min-w-64 mx-4 px-12 "
                    disableRipple
                    label="Database Backup"
                  />
                  <Tab
                    className="text-16 font-semibold min-h-40 min-w-64 mx-4 px-12 "
                    disableRipple
                    label="Users"
                  />
                  {/* <Tab
                  className="text-16 font-semibold min-h-40 min-w-64 mx-4 px-12 "
                  disableRipple
                  label="Settings"
                />
                <Tab
                  className="text-16 font-semibold min-h-40 min-w-64 mx-4 px-12 "
                  disableRipple
                  label="Uneb Results"
                /> */}
                </Tabs>
              </Toolbar>
            </AppBar>

            {selectedTab === 0 && <Settings />}
            {selectedTab === 1 && <Session />}
            {selectedTab === 2 && <Modules />}
            {selectedTab === 4 && <UserComponent />}
            {/* {selectedTab === 1 && <AboutTab />
              {selectedTab === 2 && <PhotosVideosTab />} */}

            {/* <Root
            content={
              <div className="flex flex-auto justify-center w-full  ml-20 mt-10 p-0 sm:p-0">
                {selectedTab === 0 && <Applicants />}
                {selectedTab === 1 && <AboutTab />}
              {selectedTab === 2 && <PhotosVideosTab />}
              </div>
            }
           
          /> */}
          </Box>
        </Suspense>
      )}
    </>
  );
});

export default Config;
