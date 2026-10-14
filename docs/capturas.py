# Captura las pantallas principales (escritorio y móvil) para revisión y documentación.
from playwright.sync_api import sync_playwright
out = "/home/claude/conexsur/docs/capturas/"
BASE = "http://localhost:5173"

def entrar(pg, correo):
    pg.goto(BASE + "/login"); pg.fill("input[type=email]", correo); pg.fill("input[type=password]", "Demo1234!")
    pg.click("button[type=submit]"); pg.wait_for_load_state("networkidle")

with sync_playwright() as p:
    b = p.chromium.launch()
    errores = []
    # --- Escritorio
    ctx = b.new_context(viewport={"width": 1440, "height": 860}); pg = ctx.new_page()
    pg.on("pageerror", lambda e: errores.append(str(e)))
    pg.goto(BASE + "/login"); pg.wait_for_load_state("networkidle"); pg.screenshot(path=out + "01_login.png")
    entrar(pg, "admin@conexsur.cl"); pg.wait_for_selector("text=Próximas visitas"); pg.wait_for_timeout(400); pg.screenshot(path=out + "02_resumen.png")
    pg.goto(BASE + "/admin/clientes"); pg.wait_for_selector("table"); pg.screenshot(path=out + "03_clientes.png")
    pg.click("text=Nuevo cliente"); pg.wait_for_selector("text=Guardar cliente"); pg.wait_for_timeout(300); pg.screenshot(path=out + "04_nuevo_cliente.png")
    pg.keyboard.press("Escape")
    pg.click("tbody tr >> nth=1"); pg.wait_for_selector("text=Plan contratado"); pg.screenshot(path=out + "05_ficha_cliente.png")
    pg.goto(BASE + "/admin/calendario"); pg.wait_for_selector("text=Por confirmar"); pg.wait_for_timeout(500); pg.screenshot(path=out + "06_calendario.png")
    pg.click("aside[aria-label=\"Solicitudes por confirmar\"] button >> nth=0"); pg.wait_for_selector("text=Confirmar visita"); pg.wait_for_timeout(300); pg.screenshot(path=out + "07_confirmar_visita.png")
    ctx.close()
    # --- Móvil: portal del cliente y agenda del técnico
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2); pg = ctx.new_page()
    pg.on("pageerror", lambda e: errores.append(str(e)))
    entrar(pg, "cliente@conexsur.cl"); pg.wait_for_selector("text=Próxima visita técnica"); pg.wait_for_timeout(300); pg.screenshot(path=out + "08_portal_inicio.png")
    pg.goto(BASE + "/portal/visitas/nueva"); pg.wait_for_selector("text=¿Qué necesitas?"); pg.fill("textarea", "No tengo internet desde ayer en la tarde"); pg.screenshot(path=out + "09_agendar_paso1.png")
    pg.click("text=Continuar"); pg.wait_for_selector("text=Elige la hora"); pg.wait_for_selector("[role=radiogroup][aria-label=Hora] button"); pg.wait_for_timeout(300); pg.screenshot(path=out + "10_agendar_paso2.png")
    pg.goto(BASE + "/portal/pagos"); pg.wait_for_selector("text=Historial"); pg.screenshot(path=out + "11_portal_pagos.png")
    ctx.close()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2); pg = ctx.new_page()
    entrar(pg, "tecnico@conexsur.cl"); pg.wait_for_selector("text=Mi agenda"); pg.wait_for_timeout(500); pg.screenshot(path=out + "12_tecnico_movil.png")
    print("errores JS:", errores); b.close()
