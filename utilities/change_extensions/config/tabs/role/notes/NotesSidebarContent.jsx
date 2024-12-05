import * as React from "react";
import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import { styled } from "@mui/material/styles";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { openLabelsDialog, selectLabels } from "./store/labelsSlice";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import AddTwoToneIcon from "@mui/icons-material/AddTwoTone";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import "./dialog.css";
import { useQuery } from "@apollo/client";
import { GET_ROLES } from "app/theme-layouts/layout3/graphql/queries";
import { updateSelectedModules, updateSelectedRole } from "../store/rolesSlice";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  color: "inherit!important",
  textDecoration: "none!important",
  height: 40,
  width: "100%",
  borderRadius: 20,
  paddingLeft: 16,
  paddingRight: 16,
  marginBottom: 8,
  fontWeight: 500,
  "&.active": {
    backgroundColor:
      theme.palette.mode === "light"
        ? "rgba(0, 0, 0, .05)!important"
        : "rgba(255, 255, 255, .1)!important",
    pointerEvents: "none",
    "& .list-item-icon": {
      color: theme.palette.secondary.main,
    },
  },
  "& .list-item-icon": {
    marginRight: 16,
  },
}));

function NotesSidebarContent(props) {
  const [open, setOpen] = React.useState(false);
  const { data: response, error, loading } = useQuery(GET_ROLES);
  const labels = useSelector(selectLabels);
  const selectedRole = useSelector((state) => state.rolesSlice.selectedRole);
  const dispatch = useDispatch();

  if (error) {
    console.log("err", error);
    return alert("Failed to load roles");
  }

  React.useEffect(() => {
    if (response) {
      // console.log("selected", selectedRole);
      dispatch(updateSelectedRole(response.roles[0]));
      dispatch(updateSelectedModules(response.roles[0].modules));
    }
  }, [loading]);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="px-16 py-24">
      <Stack
        alignItems="center"
        justifyContent="space-between"
        direction="row"
        spacing={2}
        style={{
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: "bolder" }}>Roles</div>

        <Button
          size="small"
          variant="contained"
          startIcon={<AddTwoToneIcon />}
          onClick={handleClickOpen}
        >
          Add Role
        </Button>
      </Stack>
      <div
        component={motion.div}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
      >
        <List className="">
          {loading ? (
            <h3
              style={{
                textAlign: "center",
              }}
            >
              Loading roles...
            </h3>
          ) : response && response.roles ? (
            response.roles.map((role) => (
              <StyledListItem
                button
                className={
                  role.id == (selectedRole && selectedRole.id) ? `active` : ""
                }
                end
                onClick={() => {
                  // console.log("clicked role", role);
                  dispatch(updateSelectedRole(role));
                  dispatch(updateSelectedModules(role.modules));
                }}
                // activeClassName="active"
              >
                <ListItemText
                  className="truncate"
                  primary={role.role_name}
                  disableTypography
                />
                <div
                  onClick={() => handleClickOpen()}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <FuseSvgIcon className="list-item-icon" color="disabled">
                    heroicons-outline:pencil-alt
                  </FuseSvgIcon>
                </div>
              </StyledListItem>
            ))
          ) : null}

          {/* <StyledListItem
            button
            // className="active"
            end
            activeClassName="active"
          >
            <ListItemText
              className="truncate"
              primary="Vice Chancellor"
              disableTypography
            />
            <FuseSvgIcon className="list-item-icon" color="disabled">
              heroicons-outline:pencil-alt
            </FuseSvgIcon>
          </StyledListItem>
          <StyledListItem
            button
            // className="active"
            end
            activeClassName="active"
          >
            <ListItemText
              className="truncate"
              primary="Assistant Admin"
              disableTypography
            />
            <FuseSvgIcon className="list-item-icon" color="disabled">
              heroicons-outline:pencil-alt
            </FuseSvgIcon>
          </StyledListItem>
          <StyledListItem
            button
            // className="active"
            end
            activeClassName="active"
          >
            <ListItemText
              className="truncate"
              primary="Dean"
              disableTypography
            />
            <FuseSvgIcon className="list-item-icon" color="disabled">
              heroicons-outline:pencil-alt
            </FuseSvgIcon>
          </StyledListItem> */}
        </List>
        <BootstrapDialog
          onClose={handleClose}
          aria-labelledby="customized-dialog-title"
          open={open}
          maxWidth="xs"
        >
          <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
            Add Role
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent dividers>
            <TextField
              autoFocus
              required
              margin="none"
              id="role"
              name="role"
              label="Role"
              type="text"
              style={{ width: "400px" }}
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleClose}>
              Save changes
            </Button>
          </DialogActions>
        </BootstrapDialog>
      </div>
    </div>
  );
}

export default NotesSidebarContent;
