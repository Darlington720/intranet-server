import { motion } from "framer-motion";
import NotesApp from "./notes/NotesApp";

function TeamTab() {
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

  return <NotesApp />;
}

export default TeamTab;
