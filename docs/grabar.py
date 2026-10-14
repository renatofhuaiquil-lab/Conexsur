# Graba el video de demostración (4 tramos) con Playwright y los une con ffmpeg. Requiere API y cliente en marcha
# y datos de demostración recién cargados (npm run semilla -- --limpiar).
import glob, os, subprocess, time
from playwright.sync_api import sync_playwright
BASE = "http://localhost:5173"
os.makedirs("video", exist_ok=True)
for f in glob.glob("video/*"): os.remove(f)
pausa = lambda s=1.2: time.sleep(s)

def entrar_demo(pg, texto_boton):
    pg.goto(BASE + "/login"); pausa(1.2)
    pg.click(f"button:has-text('{texto_boton}')"); pausa(.8)
    pg.click("button[type=submit]"); pg.wait_for_load_state("networkidle"); pausa(1.5)

def tramo(browser, nombre, ancho, alto, escala, accion):
    ctx = browser.new_context(viewport={"width": ancho, "height": alto}, device_scale_factor=escala,
                              record_video_dir="video", record_video_size={"width": ancho, "height": alto})
    pg = ctx.new_page(); accion(pg); ctx.close()
    ultimo = max(glob.glob("video/*.webm"), key=os.path.getmtime)
    os.rename(ultimo, f"video/{nombre}.webm")

codigo = {}
def cliente_agenda(pg):
    entrar_demo(pg, "Cliente"); pg.wait_for_selector("text=Próxima visita técnica"); pausa(2.5)       # inicio: plan y alerta de boleta
    pg.click("nav >> text=Visitas"); pausa(1.5); pg.click("text=Agendar"); pg.wait_for_selector("text=¿Qué necesitas?"); pausa(1)
    pg.click("text=Soporte"); pg.fill("textarea", "No tengo internet desde ayer en la tarde"); pausa(1.2); pg.click("text=Continuar")
    pg.wait_for_selector("[role=radiogroup][aria-label=Hora] button:not([disabled])"); pausa(1.5)
    pg.locator("[role=radiogroup][aria-label=Hora] button:not([disabled])").first.click(); pausa(1.2); pg.click("text=Continuar"); pausa(1.5)
    pg.click("text=Confirmar solicitud"); pg.wait_for_selector("text=Solicitud enviada"); pausa(3)
    codigo["v"] = pg.locator("dd.cifras").first.inner_text()

def admin_confirma(pg):
    entrar_demo(pg, "Administración"); pg.wait_for_selector("text=Próximas visitas"); pausa(3)              # resumen
    pg.click("nav >> text=Calendario técnico"); pg.wait_for_selector("text=Por confirmar"); pausa(2.5)
    pg.click("aside[aria-label='Solicitudes por confirmar'] li:has-text('Camila Rojas') button"); pg.wait_for_selector("text=Confirmar visita"); pausa(2.5)
    pg.select_option("aside[role=dialog] select", index=1); pausa(1.2); pg.click("button:has-text('Confirmar visita')")
    pg.wait_for_selector("aside[role=dialog]", state="detached"); pausa(3)
    pg.click("nav >> text=Clientes"); pg.wait_for_selector("table"); pausa(2)
    pg.click("button:has-text('Nuevo cliente')"); pg.wait_for_selector("text=Guardar cliente"); pausa(1)
    campos = pg.locator("aside[role=dialog] input")            # orden: RUT, nombre, teléfono, correo, dirección, comuna
    for i, val in [(0, "15.678.901-3"), (1, "Carlos Muñoz Vera"), (2, "+56 9 8765 4321"), (4, "Calle Los Alerces 456"), (5, "Osorno")]:
        campos.nth(i).fill(val); pausa(.5)
    pg.select_option("aside[role=dialog] select", index=2); pausa(.8)
    pg.click("button:has-text('Guardar cliente')"); pg.wait_for_selector("text=RUT inválido"); pausa(3)             # validación del RUT
    pg.locator("aside[role=dialog] input").nth(0).fill("15.678.901-1"); pausa(1); pg.click("button:has-text('Guardar cliente')")
    pg.wait_for_selector("text=Carlos Muñoz Vera"); pausa(2.5)
    pg.click("text=Carlos Muñoz Vera"); pg.wait_for_selector("text=Plan contratado"); pausa(2.5)             # ficha
    pg.once("dialog", lambda d: d.accept()); pg.click("button:has-text('Cortar servicio')"); pg.wait_for_selector("text=Servicio cortado"); pausa(3)

def cliente_revisa(pg):
    entrar_demo(pg, "Cliente"); pg.click("nav >> text=Visitas"); pg.wait_for_selector("text=Confirmada"); pausa(3.5)   # HU-09: el cliente ve el cambio
    pg.click("nav >> text=Pagos"); pg.wait_for_selector("text=Historial"); pausa(3)

def tecnico(pg):
    entrar_demo(pg, "Técnico"); pg.wait_for_selector("text=Mi agenda"); pausa(2.5)
    for i in range(1, 6):                                       # recorre los días de la semana hasta encontrar visitas
        pg.locator("[role=tab]").nth(i).click(); pausa(1.1)

with sync_playwright() as p:
    b = p.chromium.launch()
    tramo(b, "1_cliente", 390, 844, 1, cliente_agenda)
    tramo(b, "2_admin", 1280, 720, 1, admin_confirma)
    tramo(b, "3_cliente", 390, 844, 1, cliente_revisa)
    tramo(b, "4_tecnico", 390, 844, 1, tecnico)
    b.close()

# Une los tramos en un solo video de 1280x720 (los tramos móviles se centran sobre fondo oscuro).
entradas, filtros = [], []
for i, (n, movil) in enumerate([("1_cliente", True), ("2_admin", False), ("3_cliente", True), ("4_tecnico", True)]):
    entradas += ["-i", f"video/{n}.webm"]
    esc = "scale=-2:720,pad=1280:720:(ow-iw)/2:0:color=0x0f2b3d" if movil else "scale=1280:720"
    filtros.append(f"[{i}:v]{esc},setsar=1,fps=25[v{i}]")
cmd = ["ffmpeg", "-loglevel", "error", "-y", *entradas, "-filter_complex", ";".join(filtros) + ";[v0][v1][v2][v3]concat=n=4:v=1:a=0[v]",
       "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "demo_conexsur.mp4"]
subprocess.run(cmd, check=True); print("Video listo. Código de la visita creada:", codigo.get("v"))
