# Quickstart

## One-click Windows launch

Double-click **`gamestart.cmd`** in the game folder (`C:\DEV\Thunderbolt_3d` for your existing copy). It starts the server and opens the game in your default browser when ready. Click **DEPLOY** to play.

Keep the server window open while playing; close it or press Ctrl+C to stop. Clicking the launcher again reuses the running game. Node.js 20 or newer is still required. For Xbox input, use Chrome if your default browser does not detect the controller.

You can create a desktop shortcut to `gamestart.cmd` for convenient access. Keep the actual file in the project folder with `package.json`.

## Start your existing Windows copy from a terminal

1. Open PowerShell or Windows Terminal.
2. Run:

   ```powershell
   cd C:\DEV\Thunderbolt_3d
   npm start
   ```

3. Open **[http://127.0.0.1:8083](http://127.0.0.1:8083)** in Chrome.
4. Click **DEPLOY**, or press **Enter**.

Keep the terminal open while playing. Press **Ctrl+C** in that terminal to stop the server. If the game is already running, simply open the link; there is no need to start another server.

## Set up on another computer

You need Node.js 20 or newer, a desktop browser with WebGL 2, and access to the private GitHub repository. Install Git to use the clone command, or download the repository ZIP while signed in and extract it.

Check Node.js:

```sh
node --version
```

Clone and launch:

```sh
git clone https://github.com/HolsteredSoul/operation-thunderbolt-3d.git
cd operation-thunderbolt-3d
npm start
```

Open [http://127.0.0.1:8083](http://127.0.0.1:8083). If you downloaded a ZIP, open a terminal in the extracted folder containing `package.json` and run `npm start` there.

No `npm install`, build command, or Blender installation is needed. The game uses bundled assets and runs offline once Node.js and the repository are available. The server listens on your computer's loopback address only.

## Choose your settings

Start with **DIFFICULTY: RECRUIT** for 40% less incoming damage, longer protection after a hit, and steadier shooting. Select **STANDARD** for the original challenge. Difficulty changes while paused take effect on your next deployment; records are separate for each difficulty.

Controller settings are available before deployment and while paused:

- **STICK FEEL: GENTLE** softens small stick movements and turns smoothly. **DIRECT** restores immediate facing.
- **AIM ASSIST: 5°** is the new default; cycle to **OFF** or **3°** for less help.
- **DIRECTION MARKER** toggles the small chevron near your soldier. Mouse users have a compact crosshair. No aiming line or text labels are displayed.
- **SHAKE: REDUCED** is the default; adjust it if desired.

These settings are saved in your browser. Aim assistance remains limited to enemies near your facing direction, within range and clear sight.

## First minute of play

- **WASD / arrows:** move. **Mouse:** aim. **Hold left mouse button:** shoot.
- **R:** reload. An empty magazine also reloads while firing if you have reserves.
- **P / Escape:** pause or resume.
- Stay near cover and watch for sniper warning lines.
- If ammunition runs low, follow the **AMMO +24** marker, collect the supply, then reload.
- **FRESH LAYOUT** starts a new run; replay uses the same seed.

## Xbox controller

1. Power the controller on and connect it through Bluetooth or a USB data cable. A remembered Bluetooth pairing does not necessarily mean the controller is currently connected.
2. Open the game in a separate **Chrome** window. Physical Bluetooth input has been verified there.
3. Click inside the game, then press **A** to activate controller input.
4. Use **D-pad / left stick** to highlight **DEPLOY**, then press **A**.

During play, use **left stick to move and face**, **RT to fire**, **X to reload**, and **Menu to pause**. You can play with just the left stick: slight aim assistance helps against visible enemies near your facing direction. The right stick is available for optional manual aiming.

Menu navigation highlights buttons rather than moving the mouse pointer. Adjust **STICK DEAD ZONE** if the stick drifts; **AIM RESPONSE** adjusts how optional right-stick aim settles. If the controller disconnects, release RT, reconnect, and resume deliberately.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| `node` or `npm` is not recognized | Install Node.js 20 or newer, then reopen your terminal. |
| PowerShell says `npm.ps1` cannot run | Use `npm.cmd start`, or `node server.mjs`, from the project folder. |
| `package.json` cannot be found | Change into the extracted or cloned project folder before running `npm start`. |
| `EADDRINUSE` / port 8083 already in use | Try the game link first; the server may already be running. Otherwise use another port below. |
| Browser cannot connect | Keep the server terminal open and use the exact URL it prints. Check it for errors. |
| Blank page after opening `index.html` | Run the server and open its HTTP URL. Opening the file directly is unsupported. |
| WebGL error or poor performance | Use a browser with WebGL 2 and hardware acceleration available. Try the game's quality button to reduce rendering cost. |
| Controller does not respond | Power it back on, verify its connection, click the Chrome game page, and press A. Try a USB data cable. See [controller diagnostics](VERIFICATION.md#controller-diagnostics). |
| No audio | Click the game to allow browser audio, check system volume, and press M to unmute if needed. |
| Game pauses after switching windows | This is expected. Return to the game and resume. |

To use another port in PowerShell:

```powershell
$env:PORT = '8084'
npm start
```

Then open [http://127.0.0.1:8084](http://127.0.0.1:8084). This setting applies to that terminal session. For Command Prompt use `set PORT=8084` before `npm start`; on macOS/Linux use `PORT=8084 npm start`.

## Update your copy

If you cloned the repository and have no local edits:

```sh
git pull
```

Refresh the browser afterward. Restart the server if its code changed. A ZIP download can be updated by downloading a fresh copy into a new folder.

The [README](README.md) contains the full controls, project structure, and verification commands.
