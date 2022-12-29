const { app, BrowserWindow } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const Database = require('better-sqlite3');

//database path works both in dev and prod
const dbdatapath = path.join(app.getPath("userData"), 'sqlTest.db');

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  //This code is all from https://github.com/WiseLibs/better-sqlite3/issues/237
  /* Export a function that queues pending work. */
  const { Worker } = require('worker_threads');
  const { join } = require('path');

  const queue = [];
  const MyWorkerTask = (filePath, operator, parameters) => {
      queue.push({filePath, operator, parameters});
      drainQueue();
  };

  /* Instruct workers to drain the queue. */
  let workers = [];
  function drainQueue() {
      for (const worker of workers) {
          worker.takeWork();
      }
  }

  function spawn() {    
      //In an older version of electron + electron-forge this would work in development
      // const worker = new Worker(join(__dirname, "worker.js"));

      //However in the newer version, this is the only way I can get it to work
      const worker = new Worker('./src/worker.js');


      let job = null; // Current item from the queue
      let error = null; // Error that caused the worker to crash

      function takeWork() {
          if (!job && queue.length) {
              // If there's a job in the queue, send it to the worker
              job = queue.shift();
              worker.postMessage(job);
          }
      }
      worker.on('online', () => {
          workers.push({ takeWork });
          takeWork();
      }).on('message', (result) => {
          console.log("WORKER task completed task:", job.operator, result);
          job = null;
          //Success Message Gets Sent to Console
          mainWindow.webContents.send('seeError', "this works!");
          takeWork(); // Check if there's more work to do
      }).on('error', (err) => {
          console.error(err);
          error = err;
          //Error Message Gets Sent to Conole
          mainWindow.webContents.send('seeError', err);
      }).on('exit', (code) => {
          workers = workers.filter(w => w.takeWork !== takeWork);
          if (code !== 0) {
              console.error(`worker exited with code ${code}`);
              spawn(); // Worker died, so spawn a new one
          }
      });
  }
  spawn();

  setInterval(() => {
      console.log(`timeout add MyWorkerTask`);
      MyWorkerTask(dbdatapath, "TEST", { id: 1 });
  }, 1000);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
