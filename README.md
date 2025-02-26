# Build Final Desktop Application

Follow these steps to build the final desktop application for your platform.

## Step 1: Build the Application

Ensure that the filename you save the application as does not contain spaces. Use underscores (`_`) instead. This is because the `sqlite3` library may cause an error when running `npm install`.

Run the build command to prepare the application for packaging:

- Run `npm install`

Then 
- Run `npm run build`

## Step 2: Install Dependencies

Install Electron as a development dependency:

- Run `npm install --save-dev electron`

Also, install Electron Builder as a development dependency:

- Run `npm i --save-dev electron-builder`

## Step 3: Transpile for Electron

Transpile the application for Electron by running:

- Run `npm run transpile:electron`

**Note:** You might encounter an error in the terminal during this step. This is normal. Just save the changes, and you should see a new `dist-electron` folder created.

## Step 4: Build for Your Platform

Now, you're ready to build the application for different platforms.

### For macOS:
Run `npm run dist:mac` to build the application for macOS.

### For Windows:
Run `npm run dist:win` to build the application for Windows.

### For Linux:
Run `npm run dist:linux` to build the application for Linux.

Once the build process is complete, the final desktop application for your selected platform will be ready.
