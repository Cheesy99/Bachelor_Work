# Build Final Desktop Application

Follow these steps to build the final desktop application for your platform.

## Step 1: Install Dependencies

Ensure that the filename you save the application as does not contain spaces. Use underscores (`_`) instead. This is because the `sqlite3` library may cause an error when running `npm install`.

Once you have cloned the repo 

- Run `cd Bachelor_Work`

Run the build command to prepare the application for packaging:

- Run `npm install`

Install Electron as a development dependency:

- Run `npm install --save-dev electron`

Also, install Electron Builder as a development dependency:

- Run `npm i --save-dev electron-builder`

## Step 3: Build for Your Platform

Now, you're ready to build the application for different platforms.

### For macOS:
Run `npm run dist:mac` to build the application for macOS.

### For Windows:
Run `npm run dist:win` to build the application for Windows.

### For Linux:
Run `npm run dist:linux` to build the application for Linux.

Once the build process is complete, the final desktop application for your selected platform will be ready this will be the dist file for mac in the dist file go to the file 
mac-arm64 and there you can start the application.
