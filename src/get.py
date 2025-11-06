import pygetwindow as gw
import win32gui
import win32ui
import win32con
import sys
import io
import base64
from PIL import Image

# Establecer stdout y stderr en UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")


def get_window_icon(hwnd):
    """Obtiene el ícono de una ventana y lo convierte a base64"""
    try:
        # Intentar obtener el ícono de la ventana (preferir ICON_SMALL)
        icon = win32gui.SendMessage(hwnd, win32con.WM_GETICON, win32con.ICON_SMALL, 0)
        if not icon:
            icon = win32gui.GetClassLong(hwnd, win32con.GCL_HICONSM)
        if not icon:
            icon = win32gui.SendMessage(hwnd, win32con.WM_GETICON, win32con.ICON_BIG, 0)
        if not icon:
            icon = win32gui.GetClassLong(hwnd, win32con.GCL_HICON)

        if icon:
            # Usar tamaño más grande para mejor calidad (32x32)
            icon_size = 32

            # Crear un contexto de dispositivo compatible
            # CRÍTICO: Inicializar variables ANTES de GetDC para garantizar limpieza
            screen_dc_handle = None
            hdc = None
            hdc_mem = None
            bitmap = None
            brush = None

            try:
                # CORRECCIÓN BUG #1: Mover GetDC dentro del try para garantizar ReleaseDC
                screen_dc_handle = win32gui.GetDC(0)
                hdc = win32ui.CreateDCFromHandle(screen_dc_handle)
                hdc_mem = hdc.CreateCompatibleDC()

                # Crear un bitmap de 32 bits con mayor resolución
                bitmap = win32ui.CreateBitmap()
                bitmap.CreateCompatibleBitmap(hdc, icon_size, icon_size)
                hdc_mem.SelectObject(bitmap)

                # Limpiar con transparencia
                brush = win32gui.CreateSolidBrush(0)
                win32gui.SelectObject(hdc_mem.GetSafeHdc(), brush)
                win32gui.PatBlt(
                    hdc_mem.GetSafeHdc(), 0, 0, icon_size, icon_size, win32con.BLACKNESS
                )

                # Dibujar el ícono con DrawIconEx para mejor calidad
                win32gui.DrawIconEx(
                    hdc_mem.GetSafeHdc(),
                    0,
                    0,
                    icon,
                    icon_size,
                    icon_size,
                    0,
                    0,
                    win32con.DI_NORMAL,
                )

                # Convertir el bitmap a imagen PIL con canal alpha
                bmpinfo = bitmap.GetInfo()
                bmpstr = bitmap.GetBitmapBits(True)
                img = Image.frombuffer(
                    "RGBA",
                    (bmpinfo["bmWidth"], bmpinfo["bmHeight"]),
                    bmpstr,
                    "raw",
                    "BGRA",
                    0,
                    1,
                )

                # Convertir negro puro a transparente
                data = img.getdata()
                new_data = []
                for item in data:
                    # Si el pixel es completamente negro, hacerlo transparente
                    if item[0] == 0 and item[1] == 0 and item[2] == 0:
                        new_data.append((0, 0, 0, 0))
                    else:
                        new_data.append(item)
                img.putdata(new_data)

                # Convertir a base64 con optimización PNG
                buffer = io.BytesIO()
                img.save(buffer, format="PNG", optimize=True)
                img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

                return img_base64
            finally:
                # CRÍTICO: Garantizar limpieza de recursos GDI incluso si hay excepciones
                if bitmap is not None:
                    try:
                        win32gui.DeleteObject(bitmap.GetHandle())
                    except:
                        pass
                if brush is not None:
                    try:
                        win32gui.DeleteObject(brush)
                    except:
                        pass
                if hdc_mem is not None:
                    try:
                        hdc_mem.DeleteDC()
                    except:
                        pass
                if hdc is not None:
                    try:
                        hdc.DeleteDC()
                    except:
                        pass
                # CORRECCIÓN BUG #1: Validar que screen_dc_handle existe antes de liberar
                if screen_dc_handle is not None:
                    try:
                        win32gui.ReleaseDC(0, screen_dc_handle)
                    except:
                        pass
    except Exception:
        pass

    return None


def get():
    # Excluir los nombres requeridos
    exclude = {
        "Keeptive",
        "Experiencia de entrada de Windows",
        "Windows Input Experience",
        "Program Manager",
    }
    try:
        temp = gw.getAllTitles()
        # Generar el set sin elementos vacíos y sin la exclusión
        windows = {}
        for title in temp:
            if title:
                stripped = title.strip()
                if stripped and stripped not in exclude:
                    # Obtener el hwnd de la ventana
                    try:
                        window = gw.getWindowsWithTitle(stripped)[0]
                        hwnd = window._hWnd
                        icon_base64 = get_window_icon(hwnd)
                        windows[stripped] = icon_base64
                    except Exception:
                        windows[stripped] = None

        # Ordenar por título
        import json

        sorted_windows = dict(sorted(windows.items()))
        # Enviar como JSON
        print(json.dumps(sorted_windows), flush=True)
    except Exception as e:
        print(f"Error getting window list: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    get()
