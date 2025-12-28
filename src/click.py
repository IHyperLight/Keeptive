import pygetwindow as gw
import pyautogui
import win32api
import win32con
import win32gui
import time
import sys
import random

virtual_key_codes = {
    "\t": 0x09,  # Tab
    "\n": 0x0A,  # Line Feed (LF)
    "\r": 0x0D,  # Carriage Return (Enter)
    "!": 0x31,  # Shift + 1
    '"': 0xDE,  # Shift + '
    "#": 0x33,  # Shift + 3
    "$": 0x34,  # Shift + 4
    "%": 0x35,  # Shift + 5
    "&": 0x37,  # Shift + 7
    "'": 0xDE,  # Apostrophe
    "(": 0x39,  # Shift + 9
    ")": 0x30,  # Shift + 0
    "*": 0x38,  # Shift + 8
    "+": 0xBB,  # Shift + =
    ",": 0xBC,  # Comma
    "-": 0xBD,  # Hyphen
    ".": 0xBE,  # Period
    "/": 0xBF,  # Slash
    "0": 0x30,  # 0
    "1": 0x31,  # 1
    "2": 0x32,  # 2
    "3": 0x33,  # 3
    "4": 0x34,  # 4
    "5": 0x35,  # 5
    "6": 0x36,  # 6
    "7": 0x37,  # 7
    "8": 0x38,  # 8
    "9": 0x39,  # 9
    ":": 0xBA,  # Shift + ;
    ";": 0xBA,  # Semicolon
    "<": 0xBC,  # Shift + ,
    "=": 0xBB,  # Equals
    ">": 0xBE,  # Shift + .
    "?": 0xBF,  # Shift + /
    "@": 0x32,  # Shift + 2
    "[": 0xDB,  # Open Bracket
    "\\": 0xDC,  # Backslash
    "]": 0xDD,  # Close Bracket
    "^": 0x36,  # Shift + 6
    "_": 0xBD,  # Shift + Hyphen
    "`": 0xC0,  # Grave Accent
    "a": 0x41,  # a
    "b": 0x42,  # b
    "c": 0x43,  # c
    "d": 0x44,  # d
    "e": 0x45,  # e
    "f": 0x46,  # f
    "g": 0x47,  # g
    "h": 0x48,  # h
    "i": 0x49,  # i
    "j": 0x4A,  # j
    "k": 0x4B,  # k
    "l": 0x4C,  # l
    "m": 0x4D,  # m
    "n": 0x4E,  # n
    "o": 0x4F,  # o
    "p": 0x50,  # p
    "q": 0x51,  # q
    "r": 0x52,  # r
    "s": 0x53,  # s
    "t": 0x54,  # t
    "u": 0x55,  # u
    "v": 0x56,  # v
    "w": 0x57,  # w
    "x": 0x58,  # x
    "y": 0x59,  # y
    "z": 0x5A,  # z
    "{": 0xDB,  # Shift + [
    "|": 0xDC,  # Shift + Backslash
    "}": 0xDD,  # Shift + ]
    "~": 0xC0,  # Shift + `
    # Special keys
    "accept": 0x1E,  # IME Accept
    "add": 0x6B,  # Numpad +
    "alt": 0x12,  # Alt
    "altleft": 0xA4,  # Left Alt
    "altright": 0xA5,  # Right Alt
    "apps": 0x5D,  # Applications key
    "backspace": 0x08,  # Backspace
    "browserback": 0xA6,  # Browser Back
    "browserfavorites": 0xAB,  # Browser Favorites
    "browserforward": 0xA7,  # Browser Forward
    "browserhome": 0xAC,  # Browser Home
    "browserrefresh": 0xA8,  # Browser Refresh
    "browsersearch": 0xAA,  # Browser Search
    "browserstop": 0xA9,  # Browser Stop
    "capslock": 0x14,  # Caps Lock
    "clear": 0x0C,  # Clear
    "convert": 0x1C,  # IME Convert
    "ctrl": 0x11,  # Ctrl
    "ctrlleft": 0xA2,  # Left Ctrl
    "ctrlright": 0xA3,  # Right Ctrl
    "decimal": 0x6E,  # Decimal point
    "del": 0x2E,  # Delete
    "delete": 0x2E,  # Delete
    "divide": 0x6F,  # Numpad /
    "down": 0x28,  # Down Arrow
    "end": 0x23,  # End
    "enter": 0x0D,  # Enter
    "esc": 0x1B,  # Escape
    "escape": 0x1B,  # Escape
    "execute": 0x2B,  # Execute
    "f1": 0x70,  # F1
    "f10": 0x79,  # F10
    "f11": 0x7A,  # F11
    "f12": 0x7B,  # F12
    "f13": 0x7C,  # F13
    "f14": 0x7D,  # F14
    "f15": 0x7E,  # F15
    "f16": 0x7F,  # F16
    "f17": 0x80,  # F17
    "f18": 0x81,  # F18
    "f19": 0x82,  # F19
    "f2": 0x71,  # F2
    "f20": 0x83,  # F20
    "f21": 0x84,  # F21
    "f22": 0x85,  # F22
    "f23": 0x86,  # F23
    "f24": 0x87,  # F24
    "f3": 0x72,  # F3
    "f4": 0x73,  # F4
    "f5": 0x74,  # F5
    "f6": 0x75,  # F6
    "f7": 0x76,  # F7
    "f8": 0x77,  # F8
    "f9": 0x78,  # F9
    "final": 0x18,  # IME Final
    "hanguel": 0x15,  # Hanguel
    "hangul": 0x15,  # Hangul
    "hanja": 0x19,  # Hanja
    "help": 0x2F,  # Help
    "home": 0x24,  # Home
    "insert": 0x2D,  # Insert
    "junja": 0x17,  # Junja
    "kana": 0x15,  # Kana
    "kanji": 0x19,  # Kanji
    "launchapp1": 0xB6,  # Launch App 1
    "launchapp2": 0xB7,  # Launch App 2
    "launchmail": 0xB4,  # Launch Mail
    "launchmediaselect": 0xB5,  # Launch Media Select
    "left": 0x25,  # Left Arrow
    "modechange": 0x1F,  # Mode Change
    "multiply": 0x6A,  # Numpad *
    "nexttrack": 0xB0,  # Next Track
    "nonconvert": 0x1D,  # IME Nonconvert
    "num0": 0x60,  # Numpad 0
    "num1": 0x61,  # Numpad 1
    "num2": 0x62,  # Numpad 2
    "num3": 0x63,  # Numpad 3
    "num4": 0x64,  # Numpad 4
    "num5": 0x65,  # Numpad 5
    "num6": 0x66,  # Numpad 6
    "num7": 0x67,  # Numpad 7
    "num8": 0x68,  # Numpad 8
    "num9": 0x69,  # Numpad 9
    "numlock": 0x90,  # Num Lock
    "pagedown": 0x22,  # Page Down
    "pageup": 0x21,  # Page Up
    "pause": 0x13,  # Pause
    "pgdn": 0x22,  # Page Down
    "pgup": 0x21,  # Page Up
    "playpause": 0xB3,  # Play/Pause
    "prevtrack": 0xB1,  # Previous Track
    "print": 0x2A,  # Print
    "printscreen": 0x2C,  # Print Screen
    "prntscrn": 0x2C,  # Print Screen
    "prtsc": 0x2C,  # Print Screen
    "prtscr": 0x2C,  # Print Screen
    "return": 0x0D,  # Enter (Return)
    "right": 0x27,  # Right Arrow
    "scrolllock": 0x91,  # Scroll Lock
    "select": 0x29,  # Select
    "separator": 0x6C,  # Separator
    "shift": 0x10,  # Shift
    "shiftleft": 0xA0,  # Left Shift
    "shiftright": 0xA1,  # Right Shift
    "sleep": 0x5F,  # Sleep
    "space": 0x20,  # Space
    "stop": 0xB2,  # Stop
    "subtract": 0x6D,  # Numpad -
    "tab": 0x09,  # Tab
    "up": 0x26,  # Up Arrow
    "volumedown": 0xAE,  # Volume Down
    "volumemute": 0xAD,  # Volume Mute
    "volumeup": 0xAF,  # Volume Up
    "win": 0x5B,  # Windows Key
    "winleft": 0x5B,  # Left Windows Key
    "winright": 0x5C,  # Right Windows Key
    "yen": 0x1D,  # Yen
}


def clicks(
    mode,
    pause,
    interval_min,
    interval_max,
    timed,
    location,
    click,
    hold_time,
    window_strings,
):
    # Función para obtener un intervalo aleatorio si hay rango, o fijo si no
    def get_interval():
        if interval_max is not None and interval_max > interval_min:
            return random.uniform(interval_min, interval_max)
        return interval_min

    # Función para obtener las coordenadas exactas donde hacer click o hacia donde mover el mouse
    def get_location(hwnd):
        # Obtener el rectángulo de la ventana (cliente, es decir, solo el contenido, sin la barra de título)
        client_rect = win32gui.GetClientRect(hwnd)

        # Verificar si se eligieron coordenadas específicas para las acciones de click o movimiento
        if location == "":
            x = (client_rect[0] + client_rect[2]) // 2
            y = (client_rect[1] + client_rect[3]) // 2
        else:
            try:
                client_top_left = win32gui.ClientToScreen(hwnd, (0, 0))

                # Coordenadas absolutas
                absolute_left = client_top_left[0]
                absolute_top = client_top_left[1]
                absolute_right = absolute_left + (client_rect[2] - client_rect[0])
                absolute_bottom = absolute_top + (client_rect[3] - client_rect[1])

                coords = location.split(",")
                if len(coords) != 2:
                    print(f"Invalid location format", file=sys.stderr)
                    sys.exit(6)

                ax, ay = map(int, coords)

                if (
                    ax < absolute_left
                    or ax > absolute_right
                    or ay < absolute_top
                    or ay > absolute_bottom
                ):
                    print(
                        f"Picked location outside the window margins", file=sys.stderr
                    )
                    sys.exit(6)
                else:
                    x = ax - absolute_left
                    y = ay - absolute_top
            except (ValueError, IndexError) as e:
                print(f"Error parsing location coordinates: {e}", file=sys.stderr)
                sys.exit(6)
        return x, y

    # Función para obtener los minutos si es que se especificó tiempo y generar una época
    def start_timer(timed):
        if timed != "":
            return timed * 60, time.time()
        return None, None

    # Función para evaluar si ya se alcanzó el tiempo establecido
    def stop_timer(minutes, begin):
        if minutes is not None and time.time() - begin >= minutes:
            print(f"Time completed", file=sys.stderr)
            sys.exit(4)

    # Función para enviar click en todo el sistema
    def click_system(mode):
        invalid = ["command", "option", "optionleft", "optionright"]
        if mode == "move":
            if location == "":
                # Obtener la posición actual del cursor
                x, y = pyautogui.position()
                # Mover el cursor un pixel y devolverlo
                pyautogui.moveTo(x + 1, y)
                pyautogui.moveTo(x, y)
            else:
                try:
                    coords = location.split(",")
                    if len(coords) != 2:
                        print(
                            f"Invalid location format for system mode", file=sys.stderr
                        )
                        sys.exit(6)
                    x, y = map(int, coords)
                    pyautogui.moveTo(x, y, duration=0.5)
                except (ValueError, IndexError) as e:
                    print(
                        f"Error parsing location for system mode: {e}", file=sys.stderr
                    )
                    sys.exit(6)
        elif mode == "click":
            # Convertir hold_time de milisegundos a segundos
            hold_time_seconds = hold_time / 1000.0

            if location == "":
                # Evaluación del botón del mouse seleccionado
                if click == "L-click":
                    pyautogui.mouseDown()
                    time.sleep(hold_time_seconds)
                    pyautogui.mouseUp()
                elif click == "R-click":
                    pyautogui.mouseDown(button="right")
                    time.sleep(hold_time_seconds)
                    pyautogui.mouseUp(button="right")
                elif click == "M-click":
                    pyautogui.mouseDown(button="middle")
                    time.sleep(hold_time_seconds)
                    pyautogui.mouseUp(button="middle")
            else:
                try:
                    coords = location.split(",")
                    if len(coords) != 2:
                        print(
                            f"Invalid location format for system mode", file=sys.stderr
                        )
                        sys.exit(6)
                    x, y = map(int, coords)
                    # Evaluación del botón del mouse seleccionado
                    if click == "L-click":
                        pyautogui.mouseDown(x, y)
                        time.sleep(hold_time_seconds)
                        pyautogui.mouseUp(x, y)
                    elif click == "R-click":
                        pyautogui.mouseDown(x, y, button="right")
                        time.sleep(hold_time_seconds)
                        pyautogui.mouseUp(x, y, button="right")
                    elif click == "M-click":
                        pyautogui.mouseDown(x, y, button="middle")
                        time.sleep(hold_time_seconds)
                        pyautogui.mouseUp(x, y, button="middle")
                except (ValueError, IndexError) as e:
                    print(
                        f"Error parsing location for system mode: {e}", file=sys.stderr
                    )
                    sys.exit(6)
        else:
            # Soportar múltiples keys separadas por espacio
            keys = [k.strip() for k in mode.lower().split() if k.strip()]
            if not keys:
                print(
                    f"Enter a valid key name to use the key press mode",
                    file=sys.stderr,
                )
                sys.exit(5)

            # Presionar cada key en secuencia
            for key in keys:
                if key in pyautogui.KEYBOARD_KEYS and key not in invalid:
                    pyautogui.press(key)
                    time.sleep(0.05)  # Pequeño delay entre keys
                else:
                    print(
                        f"Invalid key name '{key}' in key sequence",
                        file=sys.stderr,
                    )
                    sys.exit(5)

    # Función para enviar clic por ventana
    def click_window(window):
        try:
            minimized_status = False
            # Obtener identificador (handler) de la ventana actual
            if not hasattr(window, "_hWnd"):
                print(f"Invalid window object", file=sys.stderr)
                sys.exit(2)
            hwnd = window._hWnd
            # Verificar si la ventana aún se encuentra activa
            if not win32gui.IsWindow(hwnd):
                print(f"A window is no longer available", file=sys.stderr)
                sys.exit(2)
            # Verificar si la ventana se encuentra en primer plano para esperar
            if pause:
                if hwnd == win32gui.GetForegroundWindow():
                    return
            # Verificar si la ventana está minimizada para restaurarla silenciosamente
            if win32gui.IsIconic(hwnd):
                minimized_status = True
                win32gui.ShowWindow(hwnd, win32con.SW_SHOWNOACTIVATE)
                time.sleep(0.01)
                win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            # Evaluar modo
            if mode == "move":
                # Enviar una instrucción de activación a la ventana para asegurar la correcta interacción
                win32gui.SendMessage(hwnd, win32con.WM_ACTIVATE, win32con.WA_ACTIVE, 0)
                # Obtener ubicación según la elección del usuario
                x, y = get_location(hwnd)
                # Enviar un movimiento de mouse
                lParam = y << 16 | x
                win32api.SendMessage(hwnd, win32con.WM_MOUSEMOVE, 0, lParam)
            elif mode == "click":
                # Enviar una instrucción de activación a la ventana para asegurar la correcta interacción
                win32gui.SendMessage(hwnd, win32con.WM_ACTIVATE, win32con.WA_ACTIVE, 0)
                # Obtener ubicación según la elección del usuario
                x, y = get_location(hwnd)
                # Enviar un clic en el centro de la ventana
                lParam = win32api.MAKELONG(x, y)
                # Evaluación del botón del mouse seleccionado
                if click == "L-click":
                    win32api.SendMessage(
                        hwnd, win32con.WM_LBUTTONDOWN, win32con.MK_LBUTTON, lParam
                    )
                    time.sleep(0.01)
                    win32api.SendMessage(hwnd, win32con.WM_LBUTTONUP, 0, lParam)
                elif click == "R-click":
                    win32api.SendMessage(
                        hwnd, win32con.WM_RBUTTONDOWN, win32con.MK_RBUTTON, lParam
                    )
                    time.sleep(0.01)
                    win32api.SendMessage(hwnd, win32con.WM_RBUTTONUP, 0, lParam)
                elif click == "M-click":
                    win32api.SendMessage(
                        hwnd, win32con.WM_MBUTTONDOWN, win32con.MK_MBUTTON, lParam
                    )
                    time.sleep(0.01)
                    win32api.SendMessage(hwnd, win32con.WM_MBUTTONUP, 0, lParam)
            elif mode == "passive":
                # Enviar la instrucción de activación a la ventana
                win32gui.SendMessage(hwnd, win32con.WM_ACTIVATE, win32con.WA_ACTIVE, 0)
            else:
                # Soportar múltiples keys separadas por espacio
                keys = [k.strip() for k in mode.lower().split() if k.strip()]
                if not keys:
                    print(
                        f"Enter a valid key name to use the key press mode",
                        file=sys.stderr,
                    )
                    sys.exit(5)

                # Enviar una instrucción de activación a la ventana para asegurar la correcta interacción
                win32gui.SendMessage(hwnd, win32con.WM_ACTIVATE, win32con.WA_ACTIVE, 0)

                # Presionar cada key en secuencia
                for key in keys:
                    if key in virtual_key_codes:
                        VK_CODE = virtual_key_codes[key]
                        win32api.SendMessage(hwnd, win32con.WM_KEYDOWN, VK_CODE, 0)
                        time.sleep(0.01)
                        win32api.SendMessage(hwnd, win32con.WM_KEYUP, VK_CODE, 0)
                        time.sleep(0.05)  # Pequeño delay entre keys
                    else:
                        print(
                            f"Invalid key name '{key}' in key sequence",
                            file=sys.stderr,
                        )
                        sys.exit(5)
            # Mandar ventana al fondo, detrás de todas las demás, después de haber mandado el click en el caso de haber sido una ventana minimizada
            if minimized_status:
                win32gui.SetWindowPos(
                    hwnd,
                    win32con.HWND_BOTTOM,
                    0,
                    0,
                    0,
                    0,
                    win32con.SWP_NOSIZE | win32con.SWP_NOMOVE | win32con.SWP_NOACTIVATE,
                )
        except Exception as e:
            print(f"Error sending command to window: {e}", file=sys.stderr)
            sys.exit(3)

    # Validar botón del mouse para modos que lo requieren
    if mode in ["click", "move"]:
        if click not in ["L-click", "R-click", "M-click"]:
            print(f"Invalid mouse button: {click}", file=sys.stderr)
            sys.exit(9)

    # Comprobar si se eligió todo el sistema
    if window_strings[0] == "":
        minutes, begin = start_timer(timed)
        end_time = begin + minutes if minutes is not None else None
        # Iniciar ciclo de clics en todo el sistema
        while True:
            click_system(mode)
            stop_timer(minutes, begin)
            current_interval = get_interval()
            if end_time is not None:
                remaining = end_time - time.time()
                if remaining <= 0:
                    print(f"Time completed", file=sys.stderr)
                    sys.exit(4)
                time.sleep(min(current_interval, remaining))
            else:
                time.sleep(current_interval)

    # Actualizar valor de pause
    if pause == "true":
        pause = True
    else:
        pause = False
    # Actualizar formato y valores de las ventanas
    window_titles = [string.strip() for string in window_strings[0].split(",")]
    windows = [
        gw.getWindowsWithTitle(title)[0]
        for title in window_titles
        if gw.getWindowsWithTitle(title)
    ]
    # Comprobar si las ventanas existen
    if len(windows) != len(window_titles):
        print(f"Not all specified windows were found", file=sys.stderr)
        sys.exit(1)

    minutes, begin = start_timer(timed)
    end_time = begin + minutes if minutes is not None else None
    # Iniciar ciclo de clics en ventanas específicas
    while True:
        for window in windows:
            click_window(window)
        stop_timer(minutes, begin)
        current_interval = get_interval()
        if end_time is not None:
            remaining = end_time - time.time()
            if remaining <= 0:
                print(f"Time completed", file=sys.stderr)
                sys.exit(4)
            time.sleep(min(current_interval, remaining))
        else:
            time.sleep(current_interval)


if __name__ == "__main__":
    try:
        # Obtener las respuestas desde el main
        if len(sys.argv) < 9:
            print(f"Insufficient arguments provided", file=sys.stderr)
            sys.exit(7)

        mode = sys.argv[1]
        pause = sys.argv[2]

        try:
            interval_min = float(sys.argv[3])
            if interval_min <= 0:
                print(f"Interval must be greater than zero", file=sys.stderr)
                sys.exit(7)
        except ValueError:
            print(f"Invalid interval value", file=sys.stderr)
            sys.exit(7)

        # Parse interval_max (optional - can be empty string)
        interval_max = None
        if sys.argv[4] != "":
            try:
                interval_max = float(sys.argv[4])
                if interval_max <= 0:
                    print(f"Interval max must be greater than zero", file=sys.stderr)
                    sys.exit(7)
                if interval_max < interval_min:
                    print(
                        f"Interval max must be greater than or equal to interval min",
                        file=sys.stderr,
                    )
                    sys.exit(7)
            except ValueError:
                print(f"Invalid interval max value", file=sys.stderr)
                sys.exit(7)

        if sys.argv[5] != "":
            try:
                timed = float(sys.argv[5])
                if timed <= 0:
                    print(f"Time must be greater than zero", file=sys.stderr)
                    sys.exit(7)
            except ValueError:
                print(f"Invalid time value", file=sys.stderr)
                sys.exit(7)
        else:
            timed = sys.argv[5]

        location = sys.argv[6]
        click = sys.argv[7]

        try:
            hold_time = float(sys.argv[8])
            if hold_time <= 0:
                print(f"Hold time must be greater than zero", file=sys.stderr)
                sys.exit(7)
        except ValueError:
            print(f"Invalid hold time value", file=sys.stderr)
            sys.exit(7)

        window_strings = sys.argv[9:]
        clicks(
            mode,
            pause,
            interval_min,
            interval_max,
            timed,
            location,
            click,
            hold_time,
            window_strings,
        )
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(8)
