import * as React from "react";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
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
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import { visuallyHidden } from "@mui/utils";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import ButtonComponent from "./ButtonComponent";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import clsx from "clsx";

function createData(id, name, calories, fat, carbs, protein) {
  return {
    id,
    name,
    calories,
    fat,
    carbs,
    protein,
  };
}

const rows = [
  {
    session: "2021-2022",
    // status: "",
    created_at: "12/07/2021",
    created_by: "Akampa Darlington",
    updated_by: "Liam Williams",
    updated_when: "2022-12-15T08:30:00",
  },
  {
    session: "2022-2023",
    // status: "",
    created_at: "01/15/2022",
    created_by: "John Doe",
    updated_by: "Emma Davis",
    updated_when: "2022-12-15T09:45:00",
  },
  {
    session: "2023-2024",
    status: "CURRENT SESSION",
    created_at: "03/22/2022",
    created_by: "Jane Smith",
    updated_by: "Michael Brown",
    updated_when: "2022-12-15T11:15:00",
  },
  {
    session: "2024-2025",
    // status: "",
    created_at: "05/08/2022",
    created_by: "Michael Johnson",
    updated_by: "Olivia Taylor",
    updated_when: "2022-12-15T12:30:00",
  },
  {
    session: "2025-2026",
    // status: "",
    created_at: "07/17/2022",
    created_by: "Sarah Adams",
    updated_by: "Charlie Wilson",
    updated_when: "2022-12-15T14:00:00",
  },
  {
    session: "2026-2027",
    // status: "",
    created_at: "09/25/2022",
    created_by: "Robert Miller",
    updated_by: "Ava Harris",
    updated_when: "2022-12-15T15:45:00",
  },
  {
    session: "2027-2028",
    // status: "",
    created_at: "11/30/2022",
    created_by: "Emily White",
    updated_by: "Jackson Wright",
    updated_when: "2022-12-15T17:00:00",
  },
];

// You can use these objects as needed in your application.

// const rows = [
//   createData(1, "Cupcake", 305, 3.7, 67, 4.3),
//   createData(2, "Donut", 452, 25.0, 51, 4.9),
//   createData(3, "Eclair", 262, 16.0, 24, 6.0),
//   createData(4, "Frozen yoghurt", 159, 6.0, 24, 4.0),
//   createData(5, "Gingerbread", 356, 16.0, 49, 3.9),
//   createData(6, "Honeycomb", 408, 3.2, 87, 6.5),
//   createData(7, "Ice cream sandwich", 237, 9.0, 37, 4.3),
//   createData(8, "Jelly Bean", 375, 0.0, 94, 0.0),
//   createData(9, "KitKat", 518, 26.0, 65, 7.0),
//   createData(10, "Lollipop", 392, 0.2, 98, 0.0),
//   createData(11, "Marshmallow", 318, 0, 81, 2.0),
//   createData(12, "Nougat", 360, 19.0, 9, 37.0),
//   createData(13, "Oreo", 437, 18.0, 63, 4.0),
// ];

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

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
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
  { id: "session", label: "Session", minWidth: 10 },
  {
    id: "status",
    numeric: false,
    // disablePadding: true,
    label: "Status",
  },
  {
    id: "created_at",
    numeric: false,
    disablePadding: false,
    label: "Created At",
  },
  {
    id: "created_by",
    numeric: false,
    disablePadding: false,
    label: "Created By",
  },
  {
    id: "updated_by",
    numeric: false,
    disablePadding: false,
    label: "updated By",
  },
  {
    id: "updated_when",
    numeric: false,
    disablePadding: false,
    label: "Updated When",
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

function EnhancedTableToolbar(props) {
  const { numSelected } = props;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        // ...(numSelected > 0 && {
        //   bgcolor: (theme) =>
        //     alpha(
        //       theme.palette.primary.main,
        //       theme.palette.action.activatedOpacity
        //     ),
        // }),
      }}
    >
      {/* {numSelected > 0 ? (
        <Typography
          sx={{ flex: "1 1 100%" }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      ) : ( */}
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        <Grid item xs={2}>
          <ButtonComponent />
        </Grid>
        <Grid item xs={2}>
          {/* <Button variant="contained">Manage Programs</Button> */}
        </Grid>
        {/* <Grid item xs={3}>
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
            </Grid> */}
      </Grid>
      {/* )} */}

      {/* {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )} */}
    </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

function DemoContent() {
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

  return (
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
          <EnhancedTableToolbar numSelected={selected.length} />
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
                      onClick={(event) => handleClick(event, row.id)}
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
                        {row.session}
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
                              "bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-50",
                            "completed" &&
                              "bg-green-50 text-green-800 dark:bg-green-600 dark:text-green-50"
                          )}
                          sx={{ "& svg": { margin: 0 } }}
                        >
                          {row.status === "Admission Letter" ? (
                            <>
                              <PictureAsPdfIcon
                                sx={{ marginRight: 5, fontSize: 16 }}
                              />
                              Admission Letter
                            </>
                          ) : row.status === "ended" ? (
                            <>
                              <PictureAsPdfIcon
                                sx={{ marginRight: 5, fontSize: 16 }}
                              />
                              Ended
                            </>
                          ) : (
                            row.status
                          )}
                        </Typography>
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
  );
}

export default DemoContent;
