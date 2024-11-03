import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link } from "react-router-dom";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

function DemoHeader(props) {
  const { leftSidebarToggle, rightSidebarToggle } = props;

  function handleClick() {}

  return (
    <div className="flex flex-col w-full sm:py-10 sm:px-40">
      <div>
        <div className="flex sm:hidden" />
      </div>
      <div className="flex items-center w-full mt-8 -mx-10">
        {leftSidebarToggle && (
          <div className="flex shrink-0 items-center">
            <IconButton onClick={leftSidebarToggle} aria-label="toggle sidebar">
              <FuseSvgIcon>material-twotone:keyboard_backspace</FuseSvgIcon>
            </IconButton>
          </div>
        )}
        <Typography
          component="h2"
          className="flex-1 text-3xl md:text-4xl font-extrabold tracking-tight leading-7 sm:leading-10 truncate mx-10"
        >
          Back to Students' Booth
        </Typography>
      </div>
    </div>
  );
}

export default DemoHeader;
