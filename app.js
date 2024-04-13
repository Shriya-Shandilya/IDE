const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Function to compile and run C/C++ code
function compileAndRun(language, code, res) {
  let command;
  let extension;
  let compiledFilename;

  // Determine the compilation command and file extension based on the selected language
  if (language === 'c') {
    command = 'gcc';
    extension = 'c';
    compiledFilename = 'a.exe'; // Assuming Windows environment, adjust if needed
  } else if (language === 'cpp') {
    command = 'g++';
    extension = 'cpp';
    compiledFilename = 'a.exe'; // Assuming Windows environment, adjust if needed
  } else {
    res.status(400).send('Unsupported language');
    return;
  }

  // Write the code to a temporary file
  const filename = `temp.${extension}`;
  const filepath = path.join(__dirname, filename);
  fs.writeFileSync(filepath, code);

  // Execute the compilation command
  exec(`${command} ${filename} -o ${compiledFilename}`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(stderr);
    } else {
      // If compilation succeeded, execute the compiled program
      exec(`${compiledFilename}`, (runError, runStdout, runStderr) => {
        if (runError) {
          res.status(500).send(runStderr);
        } else {
          res.send(runStdout);
        }

        // Clean up temporary files after execution
        cleanupFiles(filepath, compiledFilename);
      });
    }
  });
}

function cleanupFiles(filepath, compiledFilename) {
  // Using asynchronous functions for file operations
  fs.unlink(filepath, (err) => {
    if (err) {
      console.error('Error deleting temporary file:', err);
    } else {
      console.log('Temporary file deleted successfully:', filepath);
    }
  });

  fs.unlink(compiledFilename, (err) => {
    if (err) {
      console.error('Error deleting compiled file:', err);
    } else {
      console.log('Compiled file deleted successfully:', compiledFilename);
    }
  });
}

app.post('/compile', (req, res) => {
  const { language, code } = req.body;

  if (language === 'python') {
    // Write the Python code to a temporary file
    const filename = path.join(__dirname, 'temp.py');
    fs.writeFileSync(filename, code);

    // Execute the Python code using child_process
    exec(`python ${filename}`, (error, stdout, stderr) => {
      if (error) {
        res.status(500).send(stderr);
      } else {
        res.send(stdout);
      }
      // Delete the temporary file after execution
      fs.unlinkSync(filename);
    });
  } else if (language === 'c' || language === 'cpp') {
    // Call the compileAndRun function for C and C++ code
    compileAndRun(language, code, res);
  } else {
    res.status(400).send('Unsupported language');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Compiler server listening at http://localhost:${port}`);
});
