import * as React from "react";
import { styled } from "@mui/material/styles";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Fab from "@mui/material/Fab";
import toast, { Toaster } from "react-hot-toast";
import { Save } from "@mui/icons-material";
import { useMutation, useQuery } from "@apollo/client";
import { GET_MODULES } from "app/theme-layouts/layout3/graphql/queries";
import { useDispatch, useSelector } from "react-redux";
import CircularProgress from "@mui/material/CircularProgress";
import { updateAllModules, updateSelectedModules } from "../store/rolesSlice";
import { SAVE_ROLE_PERMISSIONS } from "app/theme-layouts/layout3/graphql/mutations";

function addSelectedProperty(data, selectedIdsString) {
  const selectedIds = selectedIdsString.split(",").map(Number); // Convert string to array of numbers

  return data.map((item) => {
    return {
      ...item, // Spread existing properties
      selected: selectedIds.includes(parseInt(item.id)), // Add selected property based on ID match
    };
  });
}

function combineIds(existingIds, newId) {
  if (!existingIds) {
    return newId;
  }
  const existingIdSet = new Set(
    existingIds.split(",").map((id) => parseInt(id))
  );
  const parsedNewId = parseInt(newId);

  if (existingIdSet.has(parsedNewId)) {
    existingIdSet.delete(parsedNewId);
  } else {
    existingIdSet.add(parsedNewId);
  }

  return Array.from(existingIdSet).join(",");
}

function combineObjects(existingObjects, newObject) {
  const newArray = existingObjects.filter((obj) => obj.id !== newObject.id);
  newArray.push(newObject);
  return newArray;
}

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={
      <Checkbox
        edge="start"
        checked={props.checked}
        defaultChecked={props.defaultChecked}
        tabIndex={-1}
        onClick={(e) => props.onClickCheckBox(e)}
        disableRipple
        // inputProps={{ 'aria-labelledby': labelId }}
      />
    }
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: "white",

  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(0deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

export default function CustomizedAccordions({ sendNumOfModules }) {
  const [expanded, setExpanded] = React.useState("panel1");
  const { data: response, error, loading } = useQuery(GET_MODULES);
  const [
    saveRolePermissions,
    { error: mutationError, loading: savingChanges, data: mutationResponse },
  ] = useMutation(SAVE_ROLE_PERMISSIONS);
  const selectedRole = useSelector((state) => state.rolesSlice.selectedRole);
  const selectedModules = useSelector(
    (state) => state.rolesSlice.selectedModules
  );
  // const [selectedModules, setSelectedModules] = React.useState(
  //   selectedRole ? selectedRole.modules : ""
  // );
  const dispatch = useDispatch();

  // console.log("selected Modulkes", selectedModules);

  if (error) {
    return alert("Failed to load modules");
  }

  if (mutationError) {
    return alert("Failed to save changes");
  }

  React.useEffect(() => {
    if (mutationResponse) {
      // alert("Saved Successfully");
      toast.success("Permissions Saved Successfully", {
        position: "top-right",
        duration: 3000,
      });
    }
  }, [savingChanges]);

  if (response) {
    // console.log("data", addSelectedProperty(response.modules, "1,2,4"));
    sendNumOfModules(response.modules.length);
    // dispatch(updateAllModules());
  }

  const handleChange = (panel) => (event, newExpanded) => {
    console.log("event", event);
    if (
      event.target ===
        event.currentTarget.querySelector(".MuiAccordionSummary-content") ||
      event.target === event.currentTarget.querySelector(".MuiTypography-root")
    ) {
      setExpanded(newExpanded ? panel : false);
    } else {
      event.stopPropagation(); // Stop propagation if not the icon
    }
  };

  const handleSaveData = async () => {
    await saveRolePermissions({
      variables: {
        roleId: selectedRole.id,
        modules: selectedModules,
      },
    });
  };

  return (
    <div className="h-full">
      {loading ? (
        <h2
          style={{
            textAlign: "center",
          }}
        >
          Loading Modules...
        </h2>
      ) : response ? (
        addSelectedProperty(response.modules, selectedModules).map((m) => (
          <Accordion expanded={expanded === m.id} onChange={handleChange(m.id)}>
            <AccordionSummary
              aria-controls="panel1d-content"
              id="panel1d-header"
              // defaultChecked={m.selected}
              checked={m.selected}
              onClickCheckBox={(e) => {
                // console.log("selected modules", selectedModules);
                // console.log("selected", combineObjects(selectedModules, m));
                // console.log("the ids", combineIds(selectedModules, m.id));

                dispatch(
                  updateSelectedModules(combineIds(selectedModules, m.id))
                );
                // console.log("event", e.target.checked);
              }}
            >
              <Typography
                style={{
                  fontSize: "2.0rem",
                  fontWeight: "bolder",
                }}
              >
                {m.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <FormControlLabel
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontSize: "1.7rem",
                    },
                  }}
                  control={
                    <Checkbox
                      disabled={m.selected ? false : true}
                      // checked={dense}
                      // onChange={(event) => setDense(event.target.checked)}
                    />
                  }
                  label="Can admit students"
                />
                <FormControlLabel
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontSize: "1.7rem",
                    },
                  }}
                  control={
                    <Checkbox
                      disabled={m.selected ? false : true}
                      // checked={secondary}
                      // onChange={(event) => setSecondary(event.target.checked)}
                    />
                  }
                  label="Can print admission letters"
                />
                <FormControlLabel
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontSize: "1.7rem",
                    },
                  }}
                  control={
                    <Checkbox
                      disabled={m.selected ? false : true}
                      // checked={secondary}
                      // onChange={(event) => setSecondary(event.target.checked)}
                    />
                  }
                  label="Can set admission schemes"
                />
                <FormControlLabel
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontSize: "1.7rem",
                    },
                  }}
                  control={
                    <Checkbox
                      disabled={m.selected ? false : true}
                      // checked={secondary}
                      // onChange={(event) => setSecondary(event.target.checked)}
                    />
                  }
                  label="Can push students to postgraduate system"
                />
                <FormControlLabel
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontSize: "1.7rem",
                    },
                  }}
                  control={
                    <Checkbox
                      disabled={m.selected ? false : true}
                      // checked={secondary}
                      // onChange={(event) => setSecondary(event.target.checked)}
                    />
                  }
                  label="Can print admission letters"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        ))
      ) : null}

      <Fab
        color="secondary"
        aria-label="save"
        variant="extended"
        sx={{ position: "fixed", bottom: 80, right: 50 }}
        disabled={response && response.modules.length > 0 ? false : true}
        onClick={handleSaveData}
      >
        {!savingChanges && <Save />}
        {savingChanges ? (
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
          "Save"
        )}
      </Fab>

      <Toaster />
    </div>
  );
}
