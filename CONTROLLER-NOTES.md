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
