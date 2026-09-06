"""Read-only Windows Xbox connection probe. No pairing or driver changes."""
import ctypes as c
from ctypes import wintypes as w
import json


class SystemTime(c.Structure):
    _fields_ = [(name, w.WORD) for name in
                ('year', 'month', 'weekday', 'day', 'hour', 'minute', 'second', 'milliseconds')]


class BluetoothInfo(c.Structure):
    _fields_ = [('size', w.DWORD), ('address', c.c_ulonglong), ('device_class', w.DWORD),
                ('connected', w.BOOL), ('remembered', w.BOOL), ('authenticated', w.BOOL),
                ('last_seen', SystemTime), ('last_used', SystemTime), ('name', w.WCHAR * 248)]


class BluetoothSearch(c.Structure):
    _fields_ = [('size', w.DWORD), ('authenticated', w.BOOL), ('remembered', w.BOOL),
                ('unknown', w.BOOL), ('connected', w.BOOL), ('inquiry', w.BOOL),
                ('timeout', w.BYTE), ('radio', w.HANDLE)]


class XInputPad(c.Structure):
    _fields_ = [('buttons', w.WORD), ('left_trigger', w.BYTE), ('right_trigger', w.BYTE),
                ('left_x', c.c_short), ('left_y', c.c_short), ('right_x', c.c_short), ('right_y', c.c_short)]


class XInputState(c.Structure):
    _fields_ = [('packet', w.DWORD), ('pad', XInputPad)]


def inspect():
    bt = c.WinDLL('bthprops.cpl', use_last_error=True)
    bt.BluetoothFindFirstDevice.restype = w.HANDLE
    bt.BluetoothFindFirstDevice.argtypes = [c.POINTER(BluetoothSearch), c.POINTER(BluetoothInfo)]
    bt.BluetoothFindNextDevice.argtypes = [w.HANDLE, c.POINTER(BluetoothInfo)]
    bt.BluetoothFindDeviceClose.argtypes = [w.HANDLE]
    search = BluetoothSearch()
    search.size = c.sizeof(search)
    search.authenticated = search.remembered = search.unknown = search.connected = 1
    info = BluetoothInfo()
    info.size = c.sizeof(info)
    handle = bt.BluetoothFindFirstDevice(c.byref(search), c.byref(info))
    devices = []
    error = c.get_last_error() if not handle else 0
    if handle:
        try:
            while True:
                if 'xbox' in info.name.lower() or 'controller' in info.name.lower():
                    devices.append({'name': info.name, 'connected': bool(info.connected),
                                    'remembered': bool(info.remembered), 'paired': bool(info.authenticated)})
                if not bt.BluetoothFindNextDevice(handle, c.byref(info)):
                    break
        finally:
            bt.BluetoothFindDeviceClose(handle)
    xi = c.WinDLL('xinput1_4.dll')
    xi.XInputGetState.argtypes = [w.DWORD, c.POINTER(XInputState)]
    slots = []
    for index in range(4):
        state = XInputState()
        result = xi.XInputGetState(index, c.byref(state))
        slots.append({'slot': index, 'result': result, 'connected': result == 0,
                      'packet': state.packet, 'buttons': state.pad.buttons,
                      'triggers': [state.pad.left_trigger, state.pad.right_trigger],
                      'sticks': [state.pad.left_x, state.pad.left_y, state.pad.right_x, state.pad.right_y]})
    return {'bluetooth_classic': devices, 'bluetooth_error': error, 'xinput': slots}


if __name__ == '__main__':
    print(json.dumps(inspect()))
