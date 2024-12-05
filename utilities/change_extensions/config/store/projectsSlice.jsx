import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from "@reduxjs/toolkit";
import axios from "axios";

export const getProjects = createAsyncThunk(
  "projectDashboardApp/projects/getProjects",
  async () => {
    const response = await axios.get("/api/dashboards/project/projects");
    console.log(response.data);
    return [
      {
        id: 1,
        name: "ACME Corp. Backend App",
      },
      {
        id: 2,
        name: "ACME Corp. Frontend App",
      },
      {
        id: 3,
        name: "Creapond",
      },
      {
        id: 4,
        name: "Withinpixels",
      },
    ];
  }
);

const projectsAdapter = createEntityAdapter({});

export const {
  selectAll: selectProjects,
  selectEntities: selectProjectsEntities,
  selectById: selectProjectById,
} = projectsAdapter.getSelectors((state) => state.projectDashboardApp.projects);

const projectsSlice = createSlice({
  name: "projectDashboardApp/projects",
  initialState: projectsAdapter.getInitialState(),
  reducers: {},
  extraReducers: {
    [getProjects.fulfilled]: projectsAdapter.setAll,
  },
});

export default projectsSlice.reducer;
