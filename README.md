## Build Final Desktop Application

Follow these steps to build the final desktop application for your platform.

---

### Prerequisite: Use Node.js 20

Ensure you are using **Node.js version 20** before running any commands. You can check your Node.js version with:

```sh
node -v
```


Then:

```sh
npm run build
```

---

### Step 2: Install Dependencies

Install Electron as a development dependency:

```sh
npm install --save-dev electron
```

Also, install Electron Builder as a development dependency:

```sh
npm i --save-dev electron-builder
```

---

### Step 3 & 4: Transpile and Build for Your Platform

Now, you're ready to build the application for different platforms. If you encounter an error, continue to  Step 4 and retry Step 3.

#### Step 3: Build for Your Platform

For **macOS**:

```sh
npm run dist:mac
```

For **Windows**:

```sh
npm run dist:win
```

For **Linux**:

```sh
npm run dist:linux
```

#### Step 4: Transpile for Electron (Only if needed)

If you encounter an error while building, transpile the application for Electron by running:

```sh
npm run transpile:electron
```

> **Note:** You might encounter an error in the terminal during this step. This is normal. Just save the changes, and you should see a new `dist-electron` folder created. After this, retry Step 3.

---

Once the build process is complete, the final desktop application for your selected platform will be ready. This will be the `dist` file.
