import FuseNavigation from "@fuse/core/FuseNavigation";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import ListItem from "@mui/material/ListItem";

import { Box } from "@mui/system";
import ListItemText from "@mui/material/ListItemText";
import format from "date-fns/format";
import { styled } from "@mui/material/styles";
import Input from "@mui/material/Input";
import Paper from "@mui/material/Paper";
import { motion } from "framer-motion";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import Skeleton from "@mui/material/Skeleton";

const navigationData = [
  {
    id: "1",
    title: "Actions",
    subtitle: "Task, project & team",
    type: "group",
    children: [
      {
        id: "1.1",
        title: "Create task",
        type: "item",
        icon: "heroicons-outline:plus-circle",
      },
      {
        id: "1.2",
        title: "Create team",
        type: "item",
        icon: "heroicons-outline:user-group",
      },
      {
        id: "1.3",
        title: "Create project",
        type: "item",
        icon: "heroicons-outline:briefcase",
      },
      {
        id: "1.4",
        title: "Create user",
        type: "item",
        icon: "heroicons-outline:user-add",
      },
      {
        id: "1.5",
        title: "Assign user or team",
        subtitle: "Assign to a task or a project",
        type: "item",
        icon: "heroicons-outline:badge-check",
      },
    ],
  },
  {
    id: "2",
    title: "Tasks",
    type: "group",
    children: [
      {
        id: "2.1",
        title: "All tasks",
        type: "item",
        icon: "heroicons-outline:clipboard-list",
        badge: {
          title: "49",
          classes: "px-2 bg-primary text-on-primary rounded-full",
        },
      },
      {
        id: "2.2",
        title: "Ongoing tasks",
        type: "item",
        icon: "heroicons-outline:clipboard-copy",
      },
      {
        id: "2.3",
        title: "Completed tasks",
        type: "item",
        icon: "heroicons-outline:clipboard-check",
      },
      {
        id: "2.4",
        title: "Abandoned tasks",
        type: "item",
        icon: "heroicons-outline:clipboard",
      },
      {
        id: "2.5",
        title: "Assigned to me",
        type: "item",
        icon: "heroicons-outline:user",
      },
      {
        id: "2.6",
        title: "Assigned to my team",
        type: "item",
        icon: "heroicons-outline:users",
      },
    ],
  },
  {
    id: "3",
    title: "Settings",
    type: "group",
    children: [
      {
        id: "3.1",
        title: "General",
        type: "collapse",
        icon: "heroicons-outline:cog",
        children: [
          {
            id: "3.1.1",
            title: "Tasks",
            type: "item",
          },
          {
            id: "3.1.2",
            title: "Users",
            type: "item",
          },
          {
            id: "3.1.3",
            title: "Teams",
            type: "item",
          },
        ],
      },
      {
        id: "3.2",
        title: "Account",
        type: "collapse",
        icon: "heroicons-outline:user-circle",
        children: [
          {
            id: "3.2.1",
            title: "Personal",
            type: "item",
          },
          {
            id: "3.2.2",
            title: "Payment",
            type: "item",
          },
          {
            id: "3.2.3",
            title: "Security",
            type: "item",
          },
        ],
      },
    ],
  },
  {
    id: "4",
    type: "divider",
  },
];

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  "&.active": {
    backgroundColor: theme.palette.background.default,
  },
}));

function DemoSidebar() {
  const [searchText, setSearchText] = useState("");

  function handleSearchText(event) {
    setSearchText(event.target.value);
  }

  const container = {
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="px-12 py-10">
      <div className="mx-12 text-2xl font-bold mb-10 tracking-tighter">
        Sammary
      </div>

      {useMemo(
        () => (
          <Paper className="flex p-4 items-center w-full px-16 py-0 border-1 h-40 rounded-full shadow-none">
            <FuseSvgIcon color="action" size={20}>
              heroicons-solid:search
            </FuseSvgIcon>

            <Input
              placeholder="Search Program"
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

      <motion.div
        className="flex flex-col shrink-0"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div>
          <Typography
            className="font-medium text-15 px-10 py-10"
            color="secondary.main"
          >
            Main Campus
          </Typography>
        </motion.div>
      </motion.div>

      <motion.div>
        <div className={"border-b-1"}>
          <StyledListItem
            button
            className="px-5 py-0 min-h-30"
            // active={routeParams.id === contact.id ? 1 : 0}
            // component={NavLinkAdapter}
            // to={`/apps/chat/${contact.id}`}
            end
            activeClassName="active"
          >
            <ListItemText
              classes={{
                root: "min-w-px px-16",
                primary: "font-medium text-14",
                secondary: "truncate",
              }}
              primary="LLB"
            />

            <div className="flex flex-col justify-center items-end">
              <div className="items-center">
                <Box
                  sx={{
                    backgroundColor: "secondary.main",
                    color: "secondary.contrastText",
                  }}
                  className="flex items-center justify-center min-w-20 h-20 rounded-full font-medium text-10 text-center"
                >
                  {55}
                </Box>
              </div>
            </div>
          </StyledListItem>
        </div>

        <div className={"border-b-1"}>
          <StyledListItem
            button
            className="px-5 py-0 min-h-30"
            // active={routeParams.id === contact.id ? 1 : 0}
            // component={NavLinkAdapter}
            // to={`/apps/chat/${contact.id}`}
            end
            activeClassName="active"
          >
            <ListItemText
              classes={{
                root: "min-w-px px-16",
                primary: "font-medium text-14",
                secondary: "truncate",
              }}
              primary="LLB"
            />

            <div className="flex flex-col justify-center items-end">
              <div className="items-center">
                <Box
                  sx={{
                    backgroundColor: "secondary.main",
                    color: "secondary.contrastText",
                  }}
                  className="flex items-center justify-center min-w-20 h-20 rounded-full font-medium text-10 text-center"
                >
                  {55}
                </Box>
              </div>
            </div>
          </StyledListItem>
        </div>

        <div className={"border-b-1"}>
          <StyledListItem
            button
            className="px-5 py-0 min-h-30"
            // active={routeParams.id === contact.id ? 1 : 0}
            // component={NavLinkAdapter}
            // to={`/apps/chat/${contact.id}`}
            end
            activeClassName="active"
          >
            <ListItemText
              classes={{
                root: "min-w-px px-16",
                primary: "font-medium text-14",
                secondary: "truncate",
              }}
              primary="LLB"
            />

            <div className="flex flex-col justify-center items-end">
              <div className="items-center">
                <Box
                  sx={{
                    backgroundColor: "secondary.main",
                    color: "secondary.contrastText",
                  }}
                  className="flex items-center justify-center min-w-20 h-20 rounded-full font-medium text-10 text-center"
                >
                  {55}
                </Box>
              </div>
            </div>
          </StyledListItem>
        </div>

        <div className={"border-b-1"}>
          <StyledListItem
            button
            className="px-5 py-0 min-h-30"
            // active={routeParams.id === contact.id ? 1 : 0}
            // component={NavLinkAdapter}
            // to={`/apps/chat/${contact.id}`}
            end
            activeClassName="active"
          >
            <ListItemText
              classes={{
                root: "min-w-px px-16",
                primary: "font-medium text-14",
                secondary: "truncate",
              }}
              primary="LLB"
            />

            <div className="flex flex-col justify-center items-end">
              <div className="items-center">
                <Box
                  sx={{
                    backgroundColor: "secondary.main",
                    color: "secondary.contrastText",
                  }}
                  className="flex items-center justify-center min-w-20 h-20 rounded-full font-medium text-10 text-center"
                >
                  {55}
                </Box>
              </div>
            </div>
          </StyledListItem>
        </div>
      </motion.div>

      <motion.div
        className="flex flex-col shrink-0"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div>
          <Typography
            className="font-medium text-15 px-10 py-10"
            color="secondary.main"
          >
            Kampala Campus
          </Typography>
        </motion.div>
      </motion.div>

      <motion.div>
        <div className={"border-b-1"}>
          <StyledListItem
            button
            className="px-5 py-0 min-h-30"
            // active={routeParams.id === contact.id ? 1 : 0}
            // component={NavLinkAdapter}
            // to={`/apps/chat/${contact.id}`}
            end
            activeClassName="active"
          >
            <ListItemText
              classes={{
                root: "min-w-px px-16",
                primary: "font-medium text-14",
                secondary: "truncate",
              }}
              primary="LLB"
            />

            <div className="flex flex-col justify-center items-end">
              <div className="items-center">
                <Box
                  sx={{
                    backgroundColor: "secondary.main",
                    color: "secondary.contrastText",
                  }}
                  className="flex items-center justify-center min-w-20 h-20 rounded-full font-medium text-10 text-center"
                >
                  {55}
                </Box>
              </div>
            </div>
          </StyledListItem>
        </div>

        <div className={"border-b-1"}>
          <StyledListItem
            button
            className="px-5 py-0 min-h-30"
            // active={routeParams.id === contact.id ? 1 : 0}
            // component={NavLinkAdapter}
            // to={`/apps/chat/${contact.id}`}
            end
            activeClassName="active"
          >
            <ListItemText
              classes={{
                root: "min-w-px px-16",
                primary: "font-medium text-14",
                secondary: "truncate",
              }}
              primary="LLB"
            />

            <div className="flex flex-col justify-center items-end">
              <div className="items-center">
                <Box
                  sx={{
                    backgroundColor: "secondary.main",
                    color: "secondary.contrastText",
                  }}
                  className="flex items-center justify-center min-w-20 h-20 rounded-full font-medium text-10 text-center"
                >
                  {55}
                </Box>
              </div>
            </div>
          </StyledListItem>
        </div>

        <div className={"border-b-1"}>
          <StyledListItem
            button
            className="px-5 py-0 min-h-30"
            // active={routeParams.id === contact.id ? 1 : 0}
            // component={NavLinkAdapter}
            // to={`/apps/chat/${contact.id}`}
            end
            activeClassName="active"
          >
            <ListItemText
              classes={{
                root: "min-w-px px-16",
                primary: "font-medium text-14",
                secondary: "truncate",
              }}
              primary="LLB"
            />

            <div className="flex flex-col justify-center items-end">
              <div className="items-center">
                <Box
                  sx={{
                    backgroundColor: "secondary.main",
                    color: "secondary.contrastText",
                  }}
                  className="flex items-center justify-center min-w-20 h-20 rounded-full font-medium text-10 text-center"
                >
                  {55}
                </Box>
              </div>
            </div>
          </StyledListItem>
        </div>

        <div className={"border-b-1"}>
          <StyledListItem
            button
            className="px-5 py-0 min-h-30"
            // active={routeParams.id === contact.id ? 1 : 0}
            // component={NavLinkAdapter}
            // to={`/apps/chat/${contact.id}`}
            end
            activeClassName="active"
          >
            <ListItemText
              classes={{
                root: "min-w-px px-16",
                primary: "font-medium text-14",
                secondary: "truncate",
              }}
              primary="LLB"
            />

            <div className="flex flex-col justify-center items-end">
              <div className="items-center">
                <Box
                  sx={{
                    backgroundColor: "secondary.main",
                    color: "secondary.contrastText",
                  }}
                  className="flex items-center justify-center min-w-20 h-20 rounded-full font-medium text-10 text-center"
                >
                  {55}
                </Box>
              </div>
            </div>
          </StyledListItem>
        </div>
      </motion.div>
    </div>
  );
}

export default DemoSidebar;
