import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link } from "react-router-dom";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

function DemoHeader(props) {
  const { leftSidebarToggle, rightSidebarToggle } = props;

  function handleClick() {}

  return (
    <div
      className="flex flex-col p-0 w-full sm:py-10 sm:px-20"
      style={{
        // backgroundColor: "red",
        paddingTop: 0,
        paddingBottom: 5,
      }}
    >
      <div>
        <div className="flex sm:hidden" />
      </div>
      <div className="flex items-center w-full mt-8 -mx-10">
        {leftSidebarToggle && (
          <div className="flex shrink-0 items-center">
            <IconButton onClick={leftSidebarToggle} aria-label="toggle sidebar">
              <FuseSvgIcon>heroicons-outline:menu</FuseSvgIcon>
            </IconButton>
          </div>
        )}
        <Typography
          component="div"
          className="flex-1 font-bold tracking-tight leading-7 sm:leading-10 truncate mx-10"
          style={{
            fontSize: 17,
          }}
        >
          BACHELOR OF SCIENCE IN COMPUTER SCIENCE
        </Typography>
      </div>
    </div>
  );
}

export default DemoHeader;
