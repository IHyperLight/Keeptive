import pygetwindow as gw
import pyautogui
import win32api
import win32con
import win32gui
import time
import sys


def click(mode, pause, interval, timed, window_strings):
    # Función para obtener los minutos si es que se especificó tiempo y generar una época
    def start_timer(timed):
        if timed != "":
            return timed * 60, time.time()
        return None, None

    # Función para evaluar si ya se alcanzó el tiempo establecido
    def stop_timer(minutes, begin):
        if minutes and time.time() - begin >= minutes:
            print(f"Time completed", file=sys.stderr)
            sys.exit(4)

    # Función para enviar click en todo el sistema
    def click_system(mode):
        if mode == "move":
            # Obtener la posición actual del cursor
            x, y = pyautogui.position()
            # Mover el cursor un pixel y devolverlo
            pyautogui.moveTo(x + 1, y)
            pyautogui.moveTo(x, y)
        elif mode == "click":
            pyautogui.click()
        else:
            key = mode.lower()
            if key in pyautogui.KEYBOARD_KEYS:
                pyautogui.press(key)
            else:
                print(
                    f"Enter a valid key or key name to use the key mode",
                    file=sys.stderr,
                )
                sys.exit(5)

    # Función para enviar clic por ventana
    def click_window(window):
        try:
            minimized_status = False
            # Obtener identificador (handler) de la ventana actual
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
                time.sleep(0.1)
                win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            # Obtener el rectángulo de la ventana
            window_rect = win32gui.GetWindowRect(hwnd)
            x = (window_rect[0] + window_rect[2]) // 2
            y = (window_rect[1] + window_rect[3]) // 2
            # Evaluar modo
            if mode == "move":
                # Enviar un movimiento de mouse
                lParam = y << 16 | x
                win32api.SendMessage(hwnd, win32con.WM_MOUSEMOVE, 0, lParam)
            elif mode == "click":
                # Enviar un clic en el centro de la ventana
                lParam = win32api.MAKELONG(x, y)
                win32api.SendMessage(
                    hwnd, win32con.WM_LBUTTONDOWN, win32con.MK_LBUTTON, lParam
                )
                time.sleep(0.1)
                win32api.SendMessage(hwnd, win32con.WM_LBUTTONUP, 0, lParam)
            elif mode == "passive":
                # Enviar la instrucción de activación a la ventana
                win32gui.SendMessage(hwnd, win32con.WM_ACTIVATE, win32con.WA_ACTIVE, 0)
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
            print(f"Error sending command to window", file=sys.stderr)
            sys.exit(3)

    # Comprobar si se eligió todo el sistema
    if window_strings[0] == "":
        minutes, begin = start_timer(timed)
        end_time = begin + minutes if minutes else None
        # Iniciar ciclo de clics en todo el sistema
        while True:
            click_system(mode)
            stop_timer(minutes, begin)
            time.sleep(min(interval, end_time - time.time()) if end_time else interval)
            if end_time and time.time() >= end_time:
                print(f"Time completed", file=sys.stderr)
                sys.exit(4)

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
    end_time = begin + minutes if minutes else None
    # Iniciar ciclo de clics en ventanas específicas
    while True:
        for window in windows:
            click_window(window)
        stop_timer(minutes, begin)
        time.sleep(min(interval, end_time - time.time()) if end_time else interval)
        if end_time and time.time() >= end_time:
            print(f"Time completed", file=sys.stderr)
            sys.exit(4)


if __name__ == "__main__":
    # Obtener las respuestas desde el main
    mode = sys.argv[1]
    pause = sys.argv[2]
    interval = float(sys.argv[3])
    if sys.argv[4] != "":
        timed = float(sys.argv[4])
    else:
        timed = sys.argv[4]
    window_strings = sys.argv[5:]
    click(mode, pause, interval, timed, window_strings)
