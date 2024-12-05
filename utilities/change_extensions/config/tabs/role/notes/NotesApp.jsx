import withReducer from "app/store/withReducer";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { lighten, styled } from "@mui/material/styles";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";

import NavigationIcon from "@mui/icons-material/Navigation";
import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import LabelsDialog from "./dialogs/labels/LabelsDialog";
import NoteDialog from "./dialogs/note/NoteDialog";
import NewNote from "./NewNote";
import NoteList from "./NoteList";
import NotesHeader from "./NotesHeader";
import NotesSidebarContent from "./NotesSidebarContent";
import reducer from "./store";
import { getLabels } from "./store/labelsSlice";
import { getNotes } from "./store/notesSlice";

const Root = styled(FusePageCarded)(({ theme }) => ({
  "& .FusePageCarded-header": {},
  "& .FusePageCarded-sidebar": {},
  "& .FusePageCarded-leftSidebar": {},
  "& .FusePageCarded-content": {
    // backgroundColor: "green",
  },
}));

function NotesApp(props) {
  const dispatch = useDispatch();
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const routeParams = useParams();
  const [numOfModules, setNumOfModules] = useState(null);
  const selectedRole = useSelector((state) => state.rolesSlice.selectedRole);

  useEffect(() => {
    dispatch(getNotes(routeParams));
    dispatch(getLabels());
  }, [dispatch, routeParams]);

  return (
    <>
      <Root
        // header={<NotesHeader onSetSidebarOpen={setLeftSidebarOpen} />}

        content={
          <div>
            <div style={{ paddingLeft: "15px", paddingTop: "15px" }}>
              <span style={{ fontSize: "2.2rem" }}>Permissions:</span>{" "}
              <span style={{ fontWeight: "bolder", fontSize: "2.0rem" }}>
                {selectedRole ? selectedRole.role_name : null}
              </span>
            </div>
            <div className="flex flex-col w-full items-center p-24">
              <Box
                className="w-full rounded-16 border p-24 flex flex-col "
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "light"
                      ? lighten(theme.palette.background.default, 0.4)
                      : lighten(theme.palette.background.default, 0.02),
                  // height: "calc(100vh - 300px)",
                }}
              >
                <div style={{ marginBottom: "5px" }}>
                  <h3>Modules {numOfModules ? ` - ${numOfModules}` : ""}</h3>
                </div>
                {/* <NewNote /> */}

                <div
                  style={{
                    height: "calc(100vh - 240px)",
                    overflowY: "scroll",
                  }}
                >
                  <NoteList
                    sendNumOfModules={(num) => {
                      // console.log("num", num);
                      setNumOfModules(num);
                    }}
                  />
                </div>
              </Box>

              <NoteDialog />
              <LabelsDialog />
            </div>
          </div>
        }
        leftSidebarOpen={leftSidebarOpen}
        leftSidebarOnClose={() => {
          setLeftSidebarOpen(false);
        }}
        leftSidebarContent={<NotesSidebarContent />}
        scroll={isMobile ? "normal" : "content"}
      />
    </>
  );
}

export default withReducer("notesApp", reducer)(NotesApp);
