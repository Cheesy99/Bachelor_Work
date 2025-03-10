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
