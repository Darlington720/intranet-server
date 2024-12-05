import * as React from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import RunningAdmissions from "./running/RunningAdmissions";

export default function LabTabs() {
  const [value, setValue] = React.useState("1");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", typography: "body1", padding: 0 }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", padding: 0 }}>
          <TabList
            onChange={handleChange}
            aria-label="lab API tabs example"
            indicatorColor="secondary"
            textColor="secondary"
            style={{ backgroundColor: "white" }}
          >
            <Tab label="Modules List" value="1" />
            {/* <Tab label="Manage Schemes" value="2" />
            <Tab label="Admission Letters" value="3" /> */}
          </TabList>
        </Box>
        <TabPanel value="1" style={{ padding: 0 }}>
          <RunningAdmissions />
        </TabPanel>
      </TabContext>
    </Box>
  );
}
