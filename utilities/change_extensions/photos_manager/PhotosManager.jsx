import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import FuseLoading from "@fuse/core/FuseLoading";
import ClickableCardComponent from "./CardComponent";
// import resultsLogo from "../../assets/results.png";
import photoManage from "../../assets/photomanage.png";
import StudentBooth from "./StudentBooth/StudentBooth";
import StaffBooth from "./StaffBooth/StaffBooth";

function PhotosManager() {
  const [loading, setLoading] = useState(false);
  const appExistsInTaskBar = useSelector((state) => state.appsSlice.exists);
  const [studentBoothActive, setStdBoothActive] = useState(false);
  const [staffBoothActive, setStaffBoothActive] = useState(false);
  const handleStudentCardClick = () => {
    // Handle card click logic here
    console.log("Student Card clicked!");
    setStdBoothActive(true);
    setStaffBoothActive(false);
  };
  const handleStaffCardClick = () => {
    // Handle card click logic here
    console.log("Staff Card clicked!");
    setStaffBoothActive(true);
    setStdBoothActive(false);
  };
  // console.log("apps in taskbar", taskBarApps);
  useEffect(() => {
    // const exists = checkAppExistence(taskBarApps, "route", "admissions");

    if (!appExistsInTaskBar) {
      setLoading(true);
    }

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <>
      {loading ? (
        <FuseLoading logo={photoManage} />
      ) : studentBoothActive ? (
        <StudentBooth />
      ) : staffBoothActive ? (
        <StaffBooth />
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <div>
            <ClickableCardComponent
              title="Student Booth"
              content="Add student photos."
              onClick={handleStudentCardClick}
            />
          </div>
          <div style={{ marginLeft: 10 }}>
            <ClickableCardComponent
              title="Staff Booth"
              content="Add staff photos."
              onClick={handleStaffCardClick}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default PhotosManager;
