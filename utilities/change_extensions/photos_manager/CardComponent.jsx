import React from "react";
import { Card, CardContent, Typography, styled, Box } from "@mui/material";
import { motion } from "framer-motion";

// Styled component for the card with dotted border and size adjustments
const DottedBorderCard = styled(Card)(({ theme }) => ({
  border: `2px dotted ${theme.palette.primary.main}`,
  cursor: "pointer",
  width: "200px",
  height: "200px",
  "&:hover": {
    boxShadow: theme.shadows[4],
  },
}));

const GradientBackground = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundImage: "linear-gradient(to right, #ff9d2f, #ff6126, #ff5345)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}));

const ClickableCardComponent = ({ title, content, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <DottedBorderCard onClick={onClick}>
        <GradientBackground>
          <CardContent>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Typography variant="h3" component="div" color="white">
                {title}
              </Typography>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Typography variant="body2" color="white">
                {content}
              </Typography>
            </motion.div>
          </CardContent>
        </GradientBackground>
      </DottedBorderCard>
    </motion.div>
  );
};

export default ClickableCardComponent;
