import React from "react";
import {
  Card,
  CardContent,
  Typography,
  styled,
  IconButton,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import { Link } from "react-router-dom";

const DottedBorderCard = styled(Card)(({ theme }) => ({
  //   border: `2px dotted ${theme.palette.primary.main}`,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  height: "50px",
  marginRight: "5px",
  marginLeft: "5px",
  borderRadius: 0,
  marginTop: "5px",
  padding: theme.spacing(0),
  "&:hover": {
    boxShadow: theme.shadows[4],
  },
}));

const BackArrowButton = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
}));

const ClickableCardComponent = ({ title, content, onClick, onBackClick }) => {
  return (
    <DottedBorderCard onClick={onClick}>
      <BackArrowButton onClick={onBackClick}>
        <Link to="/photo_manager">
          <ArrowBackIosIcon />
        </Link>
      </BackArrowButton>
      <CardContent>
        <Typography variant="h5" component="div" style={{ marginTop: "8px" }}>
          {title}
        </Typography>
      </CardContent>
    </DottedBorderCard>
  );
};

export default ClickableCardComponent;
