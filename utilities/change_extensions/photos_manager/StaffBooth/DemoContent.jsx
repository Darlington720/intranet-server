import * as React from "react";
import { useMemo, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import { Tooltip } from "@mui/material";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { lighten } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import Paper from "@mui/material/Paper";
import Input from "@mui/material/Input";
import { motion } from "framer-motion";
import Avatar from "@mui/material/Avatar";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import StarIcon from "@mui/icons-material/Star";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import Stack from "@mui/material/Stack";
import Phototable from "./Phototable";
import IconButton from "@mui/material/IconButton";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import EditIcon from "@mui/icons-material/Edit";
import LinkedCameraIcon from "@mui/icons-material/LinkedCamera";

// import BasicData from "./RegisterData/BasicData";
// import RegistrationTrack from "./RegisterData/RegistrationTrack";
// import EnrollmentTrack from "./RegisterData/EnrollmentTrack";
// import Invoices from "./RegisterData/invoices/Invoices";
// import CreditNotes from "./RegisterData/CreditNotes";
// import Ledger from "./RegisterData/Ledger";
// import Transactions from "./RegisterData/transactions/Transactions";
// import CourseInfo from '../CourseInfo';
// import CourseProgress from '../CourseProgress';

function DemoContent() {
  const [activeTab, setActiveTab] = React.useState("1");
  const [searchText, setSearchText] = useState("");

  function handleSearchText(event) {
    setSearchText(event.target.value);
  }
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <div
      className="flex-auto p-24 sm:p-40"
      style={{
        height: "calc(100vh - 110px)",
      }}
    >
      <div
        className="border-2 border-dashed rounded-2xl"
        style={{
          height: 500,
        }}
      >
        <motion.div
          // className="flex flex-wrap p-24"
          //  variants={container}
          initial="hidden"
          animate="show"
          // initial={{ scale: 0 }}
          // animate={{ scale: 1, transition: { delay: 0.1 } }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              <Grid xs={4}>
                <Card className="flex flex-col shadow">
                  <CardContent
                    className="flex flex-col flex-auto p-24"
                    style={{
                      height: "calc(100vh - 342px)",
                      overflowY: "scroll",
                    }}
                  >
                    {/* <CourseInfo course={course} className="" /> */}
                    <Grid container spacing={4}>
                      <Grid xs={8}>
                        {" "}
                        {useMemo(
                          () => (
                            <Paper className="flex p-4 items-center w-full px-16 py-0 border-1 rounded-full shadow-none">
                              <FuseSvgIcon color="action" size={20}>
                                heroicons-solid:search
                              </FuseSvgIcon>

                              <Input
                                placeholder="Enter Staff Number"
                                className="flex flex-1 px-8"
                                disableUnderline
                                fullWidth
                                value={searchText}
                                inputProps={{
                                  "aria-label": "Search",
                                }}
                                onChange={handleSearchText}
                              />
                            </Paper>
                          ),
                          [searchText]
                        )}
                      </Grid>
                      <Grid xs={3}>
                        {" "}
                        <Button
                          // className="px-16 min-w-128"
                          // size="small"
                          color="secondary"
                          variant="contained"
                          endIcon={
                            <FuseSvgIcon className="" size={20}>
                              heroicons-solid:arrow-sm-right
                            </FuseSvgIcon>
                          }
                        >
                          Search
                        </Button>
                      </Grid>
                    </Grid>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        // height: "100vh",
                      }}
                    >
                      <motion.div animate={{ x: [0, 100, 0] }}>
                        <Avatar
                          sx={{ borderColor: "purple" }}
                          className="w-200 h-200 border-4"
                          src="https://student1.zeevarsity.com:8001/get_photo.yaws?ic=nkumba&stdno=2000100121"
                          alt="User avatar"
                        />
                      </motion.div>
                    </div>
                    <List
                      sx={{
                        width: "100%",
                        maxWidth: 360,
                        bgcolor: "background.paper",
                      }}
                      aria-label="contacts"
                    >
                      <ListItem disablePadding>
                        <ListItemButton>
                          <div style={{ width: "50%", marginRight: "20px" }}>
                            <ListItemIcon>
                              <ListItemText primary="Staff Name:" />
                            </ListItemIcon>
                          </div>
                          <ListItemText primary="HAKIM MULINDE" />
                          <div style={{ marginRight: "45px" }}>
                            <FuseSvgIcon
                              className="text-24"
                              size={16}
                              color="secondary"
                            >
                              material-solid:verified
                            </FuseSvgIcon>
                          </div>
                        </ListItemButton>
                      </ListItem>

                      <ListItem disablePadding>
                        <ListItemButton>
                          <div style={{ width: "50%", marginRight: "20px" }}>
                            <ListItemIcon>
                              <ListItemText primary="Staff Number:" />
                            </ListItemIcon>
                          </div>
                          <ListItemText
                            primary="NUL211"
                            // style={{
                            //   display: "flex",
                            //   justifyContent: "space-around",
                            // }}
                          />
                        </ListItemButton>
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemButton>
                          <div style={{ width: "50%", marginRight: "20px" }}>
                            <ListItemIcon>
                              <ListItemText primary="Status:" />
                            </ListItemIcon>
                          </div>
                          <ListItemText
                            primary="active"
                            // style={{
                            //   display: "flex",
                            //   justifyContent: "space-around",
                            // }}
                          />
                        </ListItemButton>
                      </ListItem>
                    </List>
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      // minHeight="100vh"
                    >
                      <Stack direction="row" spacing={2}>
                        <Tooltip title="Upload Image" placement="top">
                          <IconButton
                            color="primary"
                            aria-label="upload picture"
                            component="label"
                          >
                            <input hidden accept="image/*" type="file" />
                            <PhotoCamera />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Image" placement="top">
                          <IconButton
                            color="primary"
                            aria-label="upload picture"
                            component="label"
                          >
                            <input hidden accept="image/*" type="file" />
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Take Photo" placement="top">
                          <IconButton
                            color="primary"
                            aria-label="upload picture"
                            component="label"
                          >
                            <input hidden accept="" type="camera" />
                            <LinkedCameraIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </CardContent>
                  {/* <CourseProgress className="" course={course} /> */}
                  <CardActions
                    className="items-center justify-end py-16 px-24"
                    sx={{
                      backgroundColor: (theme) =>
                        theme.palette.mode === "light"
                          ? lighten(theme.palette.background.default, 0.4)
                          : lighten(theme.palette.background.default, 0.03),
                    }}
                  >
                    <Button
                      className="px-16 min-w-128 uppercase"
                      color="secondary"
                      variant="contained"
                      endIcon={
                        <FuseSvgIcon className="" size={20}>
                          heroicons-solid:save
                        </FuseSvgIcon>
                      }
                    >
                      Save
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid xs={8}>
                {/* <Card className="flex flex-col  "> */}
                {/* <CardContent className="flex flex-col flex-auto p-24"> */}
                <Phototable />
                {/* </CardContent> */}
                {/* <CourseProgress className="" course={course} /> */}
                {/* </Card> */}
              </Grid>
            </Grid>
          </Box>
        </motion.div>
      </div>
    </div>
  );
}

export default DemoContent;
