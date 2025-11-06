import io
import tkinter as tk
from pynput import mouse, keyboard
import pyautogui
import atexit
import signal
import sys

# Establecer stdout y stderr en UTF-8 para asegurar que los mensajes de salida y error se muestren correctamente
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")


def adjust_coordinates(x, y, screen_width, screen_height):
    # Esquinas vetadas
    if x == 0 and y == 0:  # Esquina superior izquierda
        return 1, 1
    elif x == screen_width - 1 and y == 0:  # Esquina superior derecha
        return screen_width - 2, 1
    elif x == 0 and y == screen_height - 1:  # Esquina inferior izquierda
        return 1, screen_height - 2
    elif x == screen_width - 1 and y == screen_height - 1:  # Esquina inferior derecha
        return screen_width - 2, screen_height - 2
    else:
        return x, y


class FollowCursorApp:
    def __init__(self, root):
        self.root = root
        self.is_cleaning = False  # Flag para evitar limpieza múltiple

        # Configurar la ventana para que no tenga bordes y siempre esté en primer plano
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", True)

        self.screen_width, self.screen_height = pyautogui.size()

        # Crear una etiqueta para mostrar la posición del cursor
        self.label = tk.Label(
            root,
            text="",
            bg="#202020",
            fg="white",
            font=("TkDefaultFont", 9),
            padx=10,
            pady=5,
        )
        self.label.pack()

        # Actualizar la posición inicial del cursor y la ventana
        self.update_position()

        # Iniciar los listeners para el mouse y el teclado
        self.mouse_listener = mouse.Listener(
            on_move=self.on_move, on_click=self.on_click
        )
        self.keyboard_listener = keyboard.Listener(on_press=self.on_key_press)

        self.mouse_listener.start()
        self.keyboard_listener.start()

        # Manejar el cierre de la ventana para asegurarse de que se realice la limpieza
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

        # Registrar la función de limpieza para la salida del script
        atexit.register(self.clean_up)
        # Manejar señales de interrupción y terminación del proceso
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

        # Iniciar el bucle principal de Tkinter
        self.root.mainloop()

    def update_position(self):
        # Obtener la posición actual del cursor y actualizar la etiqueta y la posición de la ventana
        x, y = pyautogui.position()
        self.label.config(text=f"Click or press Esc to pick\nX : {x},  Y : {y}")
        self.root.geometry(f"+{x+10}+{y+10}")

    def on_move(self, x, y):
        # Actualizar la etiqueta y la posición de la ventana cuando el cursor se mueve
        self.label.config(text=f"Click or press Esc to pick\nX : {x},  Y : {y}")
        self.root.geometry(f"+{x+10}+{y+10}")

    def on_click(self, x, y, button, pressed):
        if pressed and not self.is_cleaning:
            # CRÍTICO: Setear flag ANTES de imprimir para evitar múltiples impresiones
            self.is_cleaning = True
            # Imprimir la posición del clic y cerrar la aplicación
            x, y = adjust_coordinates(x, y, self.screen_width, self.screen_height)
            self.click_position = (x, y)
            print(f"{x},{y}", flush=True)
            self.clean_up()
            # Programar destrucción del root para después del evento
            self.root.after(10, self.root.destroy)

    def on_key_press(self, key):
        if key == keyboard.Key.esc and not self.is_cleaning:
            # CRÍTICO: Setear flag ANTES de imprimir para evitar múltiples impresiones
            self.is_cleaning = True
            # Imprimir la posición del cursor y cerrar la aplicación cuando se presiona Esc
            x, y = pyautogui.position()
            x, y = adjust_coordinates(x, y, self.screen_width, self.screen_height)
            print(f"{x},{y}", flush=True)
            self.clean_up()
            # Programar destrucción del root para después del evento
            self.root.after(10, self.root.destroy)

    def on_closing(self):
        # Manejar el cierre de la ventana para asegurarse de que se realice la limpieza
        if not self.is_cleaning:
            self.clean_up()
            self.root.destroy()

    def clean_up(self):
        # CRÍTICO: Evitar limpieza múltiple
        if self.is_cleaning:
            return
        self.is_cleaning = True

        # Detener los listeners y cerrar la aplicación de manera limpia
        if hasattr(self, "mouse_listener") and self.mouse_listener:
            try:
                self.mouse_listener.stop()
            except Exception:
                pass
        if hasattr(self, "keyboard_listener") and self.keyboard_listener:
            try:
                self.keyboard_listener.stop()
            except Exception:
                pass
        if hasattr(self, "root") and self.root:
            try:
                self.root.quit()
            except Exception:
                pass

    def signal_handler(self, sig, frame):
        # Manejar señales para realizar la limpieza antes de finalizar el script
        self.clean_up()
        sys.exit(0)


if __name__ == "__main__":
    root = tk.Tk()
    app = FollowCursorApp(root)
