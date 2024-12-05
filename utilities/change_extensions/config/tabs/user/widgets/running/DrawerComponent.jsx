import React, { useState } from "react";
import { gql } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import { useEffect } from "react";
import _ from "lodash";
import * as yup from "yup";
import Grid from "@mui/material/Grid";
import Autocomplete from "@mui/material/Autocomplete";
import { useSelector } from "react-redux";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useMutation, useQuery } from "@apollo/client";
import { ADD_USER } from "app/theme-layouts/layout3/graphql/mutations";
import CircularProgress from "@mui/material/CircularProgress";

const GET_REQS = gql`
  query getReqs {
    staff_members {
      id
      title
      staff_id
      staff_name
    }
    roles {
      id
      role_name
    }
  }
`;

/**
 * Form Validation Schema
 */
const registrationSchema = yup.object().shape({
  // name: yup.string().required("You must enter your name"),
  email: yup
    .string()
    .email("You must enter a valid email")
    .required("You must enter an email"),
  password: yup.string().required("Please enter your password."),
  // passwordConfirm: yup
  //   .string()
  //   .oneOf([yup.ref("password"), null], "Passwords must match"),
  // acceptTermsConditions: yup
  //   .boolean()
  //   .oneOf([true], "The terms and conditions must be accepted."),
  role: yup.string().required("Please select a user role"),
});

const defaultValues = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
  acceptTermsConditions: false,
  role: "",
};

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "NKU";
  const charactersLength = characters.length;
  for (let i = 0; i < length - 3; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const Record = ({ key1, value }) => (
  <Grid
    container
    rowSpacing={1}
    columnSpacing={{ xs: 1, sm: 2, md: 3 }}
    className="row-xs align-items-center mg-b-5"
    style={{
      // backgroundColor: "red",
      marginBottom: 5,
    }}
  >
    <Grid item xs={2}>
      <Typography className="mg-b-0" style={{ fontSize: 14 }}>
        {`${key1}:`}
      </Typography>
    </Grid>
    <Grid item xs={6} className=" mg-md-t-0">
      {key1 === "EMAIL" ? (
        <InputLabel
          className="mg-b-0"
          style={{
            fontSize: 14,
            fontWeight: "bolder",
            color: "black",
            // width: "150px" /* Set the width of your container */,
            whiteSpace: "nowrap" /* Prevent text from wrapping */,
            overflow: "hidden" /* Hide the overflowing content */,
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </InputLabel>
      ) : key1 === "ATTACHMENT" ? (
        <a href={value} target="_blank" rel="noopener noreferrer">
          {"Click to view"}
        </a>
      ) : (
        <InputLabel
          className="mg-b-0"
          style={{
            fontSize: 14,
            fontWeight: "bolder",
            color: "black",
          }}
        >
          {value}
        </InputLabel>
      )}
    </Grid>
  </Grid>
);
function DrawerComponent() {
  const [open, setOpen] = React.useState(false);
  const user = useSelector((state) => state.user.user);
  const [selectedname, setName] = useState("");
  const [addUser, { data, loading: addUserLoading, error }] =
    useMutation(ADD_USER);

  const {
    data: reqsResponse,
    loading: reqsLoading,
    error: reqsError,
  } = useQuery(GET_REQS);

  if (reqsError) {
    return alert("Failed to load Staff members, please try again");
  }

  // if (reqsResponse) {
  //   console.log("response", reqsResponse);
  // }

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const apps = useSelector((state) => state.appsSlice.apps);
  const activeApp = apps.find((app) => app.route === "config");
  // const { staff_members, roles } = activeApp.data[0];

  const { control, formState, handleSubmit, reset } = useForm({
    mode: "onChange",
    defaultValues,
    resolver: yupResolver(registrationSchema),
  });

  // console.log("staff members", { staff_members, roles });

  const { isValid, dirtyFields, errors } = formState;

  // if (data && !addUserLoading && !error) {
  //   // console.log("data", data.addUser);
  //   handleClickOpen();
  // }
  // Generate password on component mount
  useEffect(() => {
    const generatedPassword = generateRandomString(8);
    reset({ ...defaultValues, password: generatedPassword });
  }, [reset]);

  async function onSubmit({ name, role, email }) {
    // reset(defaultValues);

    await addUser({
      variables: {
        userId: selectedname.id,
        roleId: role,
        email: email,
        createdBy: user.user_id,
      },
    });

    handleClickOpen();

    // console.log({
    //   userId: selectedname.id,
    //   roleId: role,
    //   email: email,
    //   createdBy: user.user_id,
    // });
    // console.log(selectedname);
  }

  return (
    <div className="flex flex-col flex-auto items-center sm:justify-center min-w-0">
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"User Account Created successfully"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="alert-dialog-description"
            style={{
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            The password provided is only one time and the user will be prompted
            to change it on initial login. Following are the user credentials:
          </DialogContentText>

          <Record key1={"Email"} value={data && data.addUser.email} />
          <Record key1={"password"} value={data && data.addUser.pwd} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Paper className="w-full sm:w-auto min-h-full sm:min-h-auto rounded-0 py-32 px-16 sm:p-48 sm:rounded-2xl sm:shadow">
        <div className="w-full max-w-320 sm:w-320 mx-auto sm:mx-0">
          {/* Logo for NKUMBA University */}
          <img
            className="w-50 mb-16"
            src="assets/images/logo/nkumba-uninersity.png"
            alt="University Logo"
          />

          <Typography className="mt-32 text-3xl font-extrabold tracking-tight leading-tight">
            Staff Sign up
          </Typography>

          {error ? (
            <Alert
              variant="filled"
              severity="error"
              style={
                {
                  // marginBottom: 10,
                }
              }
            >
              {error.message}
            </Alert>
          ) : null}
          <form
            name="registerForm"
            noValidate
            className="flex flex-col justify-center w-full mt-32"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Autocomplete
              disablePortal
              id="combo-box-demo"
              options={
                !reqsLoading &&
                reqsResponse &&
                reqsResponse.staff_members.map((member) => ({
                  label: `${member.title} ${member.staff_name}`,
                  id: member.id,
                }))
              }
              loading={reqsLoading}
              onChange={(event, newValue) => {
                setName(newValue);
              }}
              // value={selectedname}
              // sx={{ width: 300 }}
              renderInput={(params) => (
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...params}
                      size="small"
                      className="mb-24"
                      label="Name"
                      autoFocus
                      // onChange={(e) => setName(e.target.value)}
                      error={!!errors.name}
                      helperText={errors?.name?.message}
                      variant="outlined"
                      required
                      fullWidth
                    />
                  )}
                />
              )}
            />
            {/* <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  size="small"
                  {...field}
                  className="mb-24"
                  label="Name"
                  autoFocus
                  error={!!errors.name}
                  helperText={errors?.name?.message}
                  variant="outlined"
                  required
                  fullWidth
                />
              )}
            /> */}

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  size="small"
                  {...field}
                  className="mb-24"
                  label="User Role"
                  variant="outlined"
                  error={!!errors.role}
                  helperText={errors?.role?.message}
                  required
                  fullWidth
                >
                  {reqsLoading ? (
                    <span>Loading...</span>
                  ) : (
                    !reqsLoading &&
                    reqsResponse &&
                    reqsResponse.roles.map((role, index) => (
                      <MenuItem key={index} value={role.id}>
                        {role.role_name}
                      </MenuItem>
                    ))
                  )}
                  {/* <MenuItem value="employee">Employee</MenuItem> */}
                  {/* Add other roles as needed */}
                </TextField>
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  size="small"
                  {...field}
                  className="mb-24"
                  label="Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors?.email?.message}
                  variant="outlined"
                  required
                  fullWidth
                />
              )}
            />

            {/* <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  size="small"
                  {...field}
                  className="mb-24"
                  label="Password"
                  type="name"
                  value={field.value}
                  variant="outlined"
                  required
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              )}
            /> */}

            <Button
              // onClick={handleAddRole}
              variant="contained"
              color="secondary"
              className=" w-full mt-24"
              aria-label="Register"
              // disabled={!isValid}
              type="submit"
              size="large"
            >
              {addUserLoading ? (
                <CircularProgress
                  variant="indeterminate"
                  disableShrink
                  sx={{
                    color: "#fff",
                    animationDuration: "550ms",
                  }}
                  size={18}
                  thickness={6}
                />
              ) : (
                "Create your account"
              )}
            </Button>
          </form>
        </div>
      </Paper>
    </div>
  );
}

export default DrawerComponent;
