import React from "react";
import Box from "@mui/material/Box";
import { motion } from "framer-motion";
import TeamMembersWidget from "./widgets/TeamMembersWidget";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import PropTypes from "prop-types";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";

import { visuallyHidden } from "@mui/utils";
import Grid from "@mui/material/Grid";

import ButtonComponent from "./widgets/running/ButtonComponent";
import Button from "@mui/material/Button";
import clsx from "clsx";
import AddIcon from "@mui/icons-material/Add";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";

import DrawerComponent from "./widgets/running/DrawerComponent";
import toast, { Toaster } from "react-hot-toast";

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const rows = [
  {
    user_name: "Musiitwa Joel",
    system_role: "Administrator",
    created_by: "Joel Musiitwa",
    created_when: "22-10-06",
    status: "Active",
    updated_by: "Lubega Tasha",
    updated_when: "23-02-14",
  },
  {
    user_name: "John Doe",
    system_role: "Lecturer",
    created_by: "Jane Doe",
    created_when: "21-09-15",
    status: "Inactive",
    updated_by: "Jane Doe",
    updated_when: "22-01-02",
  },
  {
    user_name: "Alice Johnson",
    system_role: "Administrator",
    created_by: "Bob Smith",
    created_when: "20-08-29",
    status: "Active",
    updated_by: "Bob Smith",
    updated_when: "21-11-11",
  },
  {
    user_name: "Ella Thompson",
    system_role: "Lecturer",
    created_by: "Mike Davis",
    created_when: "19-07-14",
    status: "Active",
    updated_by: "Mike Davis",
    updated_when: "20-10-23",
  },
  {
    user_name: "Samuel Wilson",
    system_role: "Administrator",
    created_by: "Sara Miller",
    created_when: "18-06-05",
    status: "Inactive",
    updated_by: "Sara Miller",
    updated_when: "19-09-12",
  },
  {
    user_name: "Sophie Brown",
    system_role: "Administrator",
    created_by: "James White",
    created_when: "17-04-20",
    status: "Active",
    updated_by: "James White",
    updated_when: "18-08-02",
  },
  {
    user_name: "Daniel Lee",
    system_role: "Lecturer",
    created_by: "Emily Taylor",
    created_when: "16-03-03",
    status: "Inactive",
    updated_by: "Emily Taylor",
    updated_when: "17-06-17",
  },
  {
    user_name: "Olivia Hall",
    system_role: "Administrator",
    created_by: "Andrew Turner",
    created_when: "15-01-17",
    status: "Active",
    updated_by: "Andrew Turner",
    updated_when: "16-04-29",
  },
  {
    user_name: "Matthew Reed",
    system_role: "Lecturer",
    created_by: "Ava Collins",
    created_when: "14-12-02",
    status: "Active",
    updated_by: "Ava Collins",
    updated_when: "15-03-14",
  },
  {
    user_name: "Emma Harris",
    system_role: "Administrator",
    created_by: "William Harris",
    created_when: "13-10-17",
    status: "Inactive",
    updated_by: "William Harris",
    updated_when: "14-01-30",
  },
  {
    user_name: "Liam Johnson",
    system_role: "Administrator",
    created_by: "Sophia Jackson",
    created_when: "12-09-01",
    status: "Active",
    updated_by: "Sophia Jackson",
    updated_when: "13-12-13",
  },
  {
    user_name: "Grace Allen",
    system_role: "Lecturer",
    created_by: "Ethan Turner",
    created_when: "11-07-16",
    status: "Inactive",
    updated_by: "Ethan Turner",
    updated_when: "12-10-28",
  },
  {
    user_name: "David Miller",
    system_role: "Administrator",
    created_by: "Isabella Davis",
    created_when: "10-06-01",
    status: "Active",
    updated_by: "Isabella Davis",
    updated_when: "11-09-12",
  },
  {
    user_name: "Aiden Wilson",
    system_role: "Lecturer",
    created_by: "Chloe Thompson",
    created_when: "09-04-15",
    status: "Inactive",
    updated_by: "Chloe Thompson",
    updated_when: "10-07-28",
  },
  {
    user_name: "Nora Walker",
    system_role: "Administrator",
    created_by: "Mason Harris",
    created_when: "08-02-29",
    status: "Active",
    updated_by: "Mason Harris",
    updated_when: "09-06-11",
  },
];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const columns = [
  { id: "user_name", label: "User Name", minWidth: 10 },
  {
    id: "system_role",
    numeric: false,
    // disablePadding: true,
    label: "System Role",
  },
  {
    id: "created_by",
    numeric: false,
    disablePadding: false,
    label: "Created By",
  },
  {
    id: "created_when",
    numeric: false,
    disablePadding: false,
    label: "Created when",
  },
  {
    id: "updated_by",
    numeric: false,
    disablePadding: false,
    label: "Updated By",
  },
  {
    id: "updated_when",
    numeric: false,
    disablePadding: false,
    label: "Updated When",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: false,
    label: "Status",
  },
];

function EnhancedTableHead(props) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              "aria-label": "select all desserts",
            }}
          />
        </TableCell>
        {columns.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
            style={{
              // border: "1px solid #ddd",
              // padding: "8px",
              textAlign: "left",
            }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

function EnhancedTableToolbar({ onAddUserButtonClick }) {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
      }}
    >
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        <Grid item xs={12} sm={6}>
          <div style={{ display: "flex", gap: "5px" }}>
            <ButtonComponent />
            <Button
              variant="contained"
              onClick={onAddUserButtonClick}
              startIcon={<AddIcon />} // Add icon to the left of the button text
            >
              Add User
            </Button>
          </div>
        </Grid>
      </Grid>
    </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

function UserComponent() {
  const [value, setValue] = React.useState("1");

  const [state, setState] = React.useState({
    right: false,
  });

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  const [loading, setLoading] = React.useState(true); // Step 2
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("calories");
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      stableSort(rows, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [order, orderBy, page, rowsPerPage]
  );

  React.useEffect(() => {
    // Simulate loading delay (You can replace this with your actual data fetching logic)
    const delay = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Cleanup function to clear the timeout if the component is unmounted
    return () => clearTimeout(delay);
  }, []);

  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

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

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <motion.div
      className="flex flex-wrap p-24"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="widget flex w-full">
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
                <Tab label="Users List" value="1" />
              </TabList>
            </Box>
            <TabPanel value="1" style={{ padding: 0 }}>
              <motion.div variants={item}>
                <div className="flex-auto p-0 sm:p-0 h-full">
                  <Box sx={{ width: "100%" }}>
                    <Paper
                      sx={{
                        width: "100%",
                        mb: 2,
                        borderTopRightRadius: 0,
                        borderTopLeftRadius: 0,
                      }}
                    >
                      <EnhancedTableToolbar
                        onAddUserButtonClick={toggleDrawer("right", true)}
                        numSelected={selected.length}
                      />

                      <Drawer
                        anchor={"right"}
                        open={state["right"]}
                        onClose={toggleDrawer("right", false)}
                      >
                        <Box
                          sx={{ width: 300 }}
                          role="presentation"
                          // onClick={toggleDrawer(anchor, false)}
                          // onKeyDown={toggleDrawer(anchor, false)}
                        >
                          <DrawerComponent />
                          <Divider />
                        </Box>
                      </Drawer>
                      <Toaster />
                      <TableContainer sx={{ maxHeight: 320 }}>
                        <Table
                          sx={{ minWidth: 750 }}
                          aria-labelledby="tableTitle"
                          size={"small"}
                          stickyHeader
                          style={{
                            borderCollapse: "collapse",
                            width: "100%",
                          }}
                          aria-label="sticky table"
                        >
                          <EnhancedTableHead
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={rows.length}
                          />
                          <TableBody>
                            {visibleRows.map((row, index) => {
                              const isItemSelected = isSelected(row.id);
                              const labelId = `enhanced-table-checkbox-${index}`;

                              return (
                                <TableRow
                                  hover
                                  onClick={(event) =>
                                    handleClick(event, row.id)
                                  }
                                  role="checkbox"
                                  aria-checked={isItemSelected}
                                  tabIndex={-1}
                                  key={row.id}
                                  selected={isItemSelected}
                                  sx={{ cursor: "pointer" }}
                                >
                                  <TableCell
                                    padding="checkbox"
                                    style={{
                                      border: "1px solid #ddd",
                                      // padding: "8px",
                                      textAlign: "left",
                                    }}
                                  >
                                    <Checkbox
                                      color="primary"
                                      checked={isItemSelected}
                                      inputProps={{
                                        "aria-labelledby": labelId,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell
                                    component="th"
                                    id={labelId}
                                    scope="row"
                                    padding="none"
                                    style={{
                                      border: "1px solid #ddd",
                                      // padding: "8px",
                                      paddingLeft: 10,
                                      textAlign: "left",
                                    }}
                                  >
                                    {row.user_name}
                                  </TableCell>
                                  <TableCell
                                    component="th"
                                    id={labelId}
                                    scope="row"
                                    padding="none"
                                    style={{
                                      border: "1px solid #ddd",
                                      // padding: "8px",
                                      paddingLeft: 10,
                                      textAlign: "left",
                                    }}
                                  >
                                    {row.system_role}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    style={{
                                      border: "1px solid #ddd",
                                      // padding: "8px",
                                      textAlign: "left",
                                    }}
                                  >
                                    {row.created_by}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    style={{
                                      border: "1px solid #ddd",
                                      // padding: "8px",
                                      textAlign: "left",
                                    }}
                                  >
                                    {row.created_when}
                                  </TableCell>

                                  <TableCell
                                    align="right"
                                    style={{
                                      border: "1px solid #ddd",
                                      // padding: "8px",
                                      textAlign: "left",
                                    }}
                                  >
                                    {row.updated_by}
                                  </TableCell>

                                  <TableCell
                                    align="right"
                                    style={{
                                      border: "1px solid #ddd",
                                      // padding: "8px",
                                      textAlign: "left",
                                    }}
                                  >
                                    {row.updated_when}
                                  </TableCell>
                                  <TableCell
                                    component="th"
                                    scope="row"
                                    align="right"
                                    style={{
                                      border: "1px solid #ddd",
                                      // padding: "8px",
                                      textAlign: "left",
                                    }}
                                  >
                                    <Typography
                                      className={clsx(
                                        "inline-flex items-center font-bold text-10 px-10 py-2 rounded-full tracking-wide uppercase",
                                        "pending" &&
                                          "bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-50",
                                        "completed" &&
                                          "bg-green-50 text-green-800 dark:bg-green-600 dark:text-green-50"
                                      )}
                                      sx={{ "& svg": { margin: 0 } }}
                                    >
                                      {row.status === "Admission Letter" ? (
                                        <>
                                          <PictureAsPdfIcon
                                            sx={{
                                              marginRight: 5,
                                              fontSize: 16,
                                            }}
                                          />
                                          Admission Letter
                                        </>
                                      ) : row.status === "ended" ? (
                                        <>
                                          <PictureAsPdfIcon
                                            sx={{
                                              marginRight: 5,
                                              fontSize: 16,
                                            }}
                                          />
                                          Ended
                                        </>
                                      ) : (
                                        row.status
                                      )}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {emptyRows > 0 && (
                              <TableRow
                                style={{
                                  height: (dense ? 33 : 53) * emptyRows,
                                }}
                              >
                                <TableCell colSpan={6} />
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={rows.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                      />
                    </Paper>
                  </Box>
                </div>
              </motion.div>
            </TabPanel>
          </TabContext>
        </Box>
      </motion.div>
    </motion.div>
  );
}

export default UserComponent;
