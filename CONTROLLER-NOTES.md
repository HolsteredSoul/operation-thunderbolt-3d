# Xbox controller research and physical test

Application input follows the browser Standard Gamepad layout: axes 0/1 move, axes 2/3 aim, button 7 fires, button 2 reloads, button 9 pauses, 0 confirms, 1 backs out, and 12–15 navigate. Left stick also navigates menus with a repeat delay. The game does not move the operating-system pointer; menus use visible focus selection.

Primary references checked on 6 September 2026:

- [W3C Gamepad specification](https://www.w3.org/TR/gamepad/): canonical button/axis mapping, user interaction gating, permissions and raw/unmapped devices. The game only accepts a standard mapping rather than guessing unknown button layouts.
- [MDN Gamepad implementation guide](https://developer.mozilla.org/en-US/docs/Games/Techniques/Controls_Gamepad_API): controller interaction while the page is visible, connection/disconnection handling and per-frame input updates. Its historical sample button ordering is not substituted for the modern W3C standard mapping.
- [Microsoft XInputGetState](https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputgetstate): native state polling; ERROR_DEVICE_NOT_CONNECTED denotes an unavailable device on that backend.

## Observations, not assumptions

The user reports no response in the preview or the dedicated Chrome window. Chrome's actual navigator.getGamepads() array is empty on the focused, secure local game page after the attempted physical test. This is below the application's mapping/aiming logic; adding a mapping library cannot produce data absent from the browser API.

Windows PnP reports an Xbox Wireless Controller, Bluetooth XINPUT-compatible input device and HID game controller with OK status. That enumeration is not evidence of live button packets. A separate XInput 1.4 probe returned code 1167 for all four slots. A Windows Gaming Input probe failed to load its WinRT types, so no conclusion can be drawn from it. No firmware, driver, Bluetooth pairing or security setting has been modified.

The in-app browser inspection tool failed with the environment's sandbox-helper error. It is not established that the in-app browser lacks Gamepad support. The game now handles missing or blocked API access with a connection message and keeps keyboard/mouse gameplay working.

## Next step

The user was asked to connect through a USB data cable. Check actual Chrome controller enumeration after a button press. If a controller appears, record its ID, mapping, live axes and button indices and exercise deployment, movement, aiming, reload, menu navigation and reconnect using that hardware. If it remains absent, compare an independent standard Gamepad API demo and Windows controller input before changing game mappings. Avoid blind driver/firmware changes or describing the hardware as faulty without evidence.

QA scripts in tests/gameplay-refinements.cjs use a simulated standard controller only in the separate QA browser. They restore the actual API by reloading afterward. The controller-review browser is reserved for the user's real hardware test and has not received a gamepad fixture.


## Resolved: live Bluetooth test

On the next diagnostic pass, the native Bluetooth API returned connected=false, remembered=true, paired=true. After the user powered the controller back on, the same probe returned connected=true and XInput slot 0 returned success with live stick values. The user noted that the controller may have timed out earlier. After clicking the Chrome game and interacting with the controller, the user explicitly confirmed: "The controller now works."

Chrome then exposed device index 0 as HID-compliant game controller (STANDARD GAMEPAD Vendor: 045e Product: 02e0), mapping=standard, connected=true. This establishes physical Bluetooth operation in Chrome. The exact cause of every earlier failed attempt is not proven; the confirmed connection transition and browser interaction resolved the current failure. No drivers, firmware, pairing records, browser flags or gamepad mappings were changed. The in-app preview was not independently retested.

The UI now explicitly says to power on the controller, click the game and press A; disconnection feedback also mentions sleep. Native diagnostics are reproducible with `python tools/controller_diagnostics.py`. That read-only tool distinguishes classic Bluetooth connection from remembered pairing and reports XInput slot state; its Bluetooth enumeration does not cover LE devices.

Additional primary resources:

- [Microsoft Bluetooth device structure](https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/ns-bluetoothapis-bluetooth_device_info_struct) distinguishes connected, remembered and authenticated states.
- [Microsoft Bluetooth enumeration](https://learn.microsoft.com/en-us/windows/win32/api/bluetoothapis/nf-bluetoothapis-bluetoothfindfirstdevice) documents the classic/LE limitation.
- [MDN Gamepad guide](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API) explains interaction/visibility gating and current-object polling, and links the independent luser/gamepadtest demo. The attempted independent-demo navigation was interrupted, so it supplies no observed test result.
- Chromium's current WGI backend and gamepad feature source were also inspected. No backend flag change was justified or applied after the real device worked.

Evidence: output/physical-controller-working.txt and the user's physical-test confirmation. Earlier negative results above are historical, not the current status.


## User-requested single-stick refinement

The user found mandatory twin-stick control unintuitive and requested only very slight aim assistance. Left stick now controls movement and facing; right stick remains an optional manual override. Assistance is restricted to a 12-degree forward cone and clear visible targets, with 25% correction capped at 3 degrees. The nominal direction is stored independently of the assisted angle, preventing cumulative lock-on. Enemy selection remains stable while valid. No correction applies during manual right-stick aim or mouse input.

`node tests/controller-assist.mjs` checks facing/retention, cone/range/cover eligibility, stable selection, correction strength/cap, non-accumulation and manual override. The browser check in tests/controller-assist.cjs confirms an actual 1.5-degree correction for a six-degree offset, reticle/shot agreement and outside-cone/cover exclusion. Existing controller browser regressions are rerun separately. Initial QA retries encountered an about:blank tab after the QA browser was reset; the checks now navigate explicitly to the game before running. This was a test setup failure, not a game load failure.
