import pygetwindow as gw
import sys
import io

# Establecer stdout y stderr en UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")


def get():
    # Excluir los nombres requeridos
    exclude = [
        "Keeptive",
        "Experiencia de entrada de Windows",
        "Windows Input Experience",
        "Program Manager",
    ]
    temp = gw.getAllTitles()
    # Generar el array sin elementos vacíos y sin la exclusión
    windows = set(title for title in temp if title and title not in exclude)
    # Ordenar el array
    windows = sorted(windows)
    for title in windows:
        if title:
            print(title)


if __name__ == "__main__":
    get()