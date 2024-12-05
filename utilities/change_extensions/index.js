// const fs = require("fs");
import fs from "fs";
import path from "path";
// const path = require("path");

function changeExtensionInDirectory(directory, oldExt, newExt) {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error(`Unable to scan directory: ${err}`);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      fs.stat(filePath, (err, stat) => {
        if (err) {
          console.error(`Unable to stat file: ${err}`);
          return;
        }

        if (stat.isDirectory()) {
          changeExtensionInDirectory(filePath, oldExt, newExt); // Recursively change extension in subdirectories
        } else if (path.extname(file) === oldExt) {
          const newFilePath = path.join(
            directory,
            path.basename(file, oldExt) + newExt
          );
          fs.rename(filePath, newFilePath, (err) => {
            if (err) {
              console.error(`Error renaming file: ${err}`);
            } else {
              console.log(`Renamed: ${filePath} -> ${newFilePath}`);
            }
          });
        }
      });
    });
  });
}

// Specify the directory, old extension, and new extension
const directory = "utilities/change_extensions/config";
const oldExt = ".js";
const newExt = ".jsx";

// Call the function
changeExtensionInDirectory(directory, oldExt, newExt);
