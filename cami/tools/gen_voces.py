# -*- coding: utf-8 -*-
"""Genera las voces pregrabadas del juego de Cami con edge-tts (neural, gratis).

Uso:  python tools/gen_voces.py        (desde la carpeta cami/)
Salida: audio/voz/<hash>.mp3  +  js/voces.js (manifiesto texto-normalizado -> archivo)

La voz del navegador (speechSynthesis) queda solo como respaldo si una frase
no está en el manifiesto. Si agregas frases nuevas al juego, añádelas aquí y
vuelve a correr el script (solo genera las que falten).
"""
import asyncio, hashlib, json, re, sys
from pathlib import Path

import edge_tts

VOICE = "es-MX-DaliaNeural"   # cálida, femenina, mexicana
RATE = "+12%"                  # un poco más ágil = más alegre
PITCH = "+15Hz"                # un poco más aguda = más dulce

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio" / "voz"
MANIFEST = ROOT / "js" / "voces.js"

# ---------------------------------------------------------------- frases
P = []

# --- shell: elogios / ánimo / celebración
P += ["¡Muy bien!", "¡Bravo!", "¡Excelente!", "¡Eso es!", "¡Súper, Cami!",
      "¡Lo lograste!", "¡Qué linda!"]
P += ["¡Casi!", "Inténtalo otra vez", "¡Tú puedes, Cami!", "Mmm, otra vez"]
P += ["¡Felicidades, Cami! ¡Lo lograste!"]

# --- home
P += ["¡Hola, soy Cami! ¿Jugamos?", "¡Hola! Soy Lola."]
P += ["Burbujas", "La Granja", "Cucú", "Figuras", "Colores",
      "Grande y chico", "A contar", "Rompecabezas", "El caminito"]

# --- intros
P += ["¡Atrapa las burbujas, Cami!", "¡Vamos a la granja!",
      "¡Vamos a jugar a las escondidas!", "¡Pon cada figura en su lugar!",
      "¡Guarda cada cosa en su color!", "¡Lo grande para Cami, lo chico para Lola!",
      "¡Dale de comer a Lola!", "¡Arma el dibujo!",
      "¡Vamos a la casita de Lola! ¡Toca el dado!"]

# --- animales (granja)
ANIMALES = [("la vaca", "¡Muu!"), ("el cerdito", "¡Oink!"), ("la oveja", "¡Bee!"),
            ("la gallina", "¡Co co co!"), ("el caballo", "¡Iiii!"),
            ("el perro", "¡Guau!"), ("el gato", "¡Miau!"), ("el pato", "¡Cuac!")]
for n, s in ANIMALES:
    cap = n[0].upper() + n[1:]
    P += [f"{cap}. {s}",
          f"¿Dónde está {n}?",
          f"¿Quién dice {s.replace('¡','').replace('!','')}?",
          f"¡Sí! {cap}. {s}",
          f"Soy {n}. {s}"]

# --- burbujas
BURB = ["el moño", "el corazón", "la corona", "la estrella", "la flor",
        "el perro", "el gato", "el conejo", "el pájaro", "el pez",
        "la manzana", "el plátano", "la fresa", "las uvas", "la naranja",
        "la pelota", "el osito", "el globo", "el carro", "el tambor",
        "la mariposa", "la catarina", "la abeja", "la tortuga", "el pececito"]
for n in BURB:
    cap = n[0].upper() + n[1:]
    P += [f"¡Atrapa {n}! ¡Tres veces!", f"¡Atrapa {n}!", cap]
P += ["¡Una!", "¡Dos!", "¡Tres!", "¡Tres! ¡Lo lograste, Cami!"]

# --- cucú
CUCU = ["el conejo", "la rana", "el gato", "el pájaro", "el hámster", "Lola"]
for n in CUCU:
    cap = n[0].upper() + n[1:] if n != "Lola" else "Lola"
    P += [cap, f"¿Dónde está {n}?", f"¡Cucú! Aquí está {n}", f"¡Cucú! Soy {n}"]
P += ["Aquí no hay nadie.", "¡Ya tienes dos amigos!", "¡Ya tienes tres amigos!",
      "¡Ya tienes cuatro amigos!", "¡Cinco amigos! ¡Todos contigo, Cami!"]

# --- figuras
FIG = ["el círculo", "el cuadrado", "el triángulo", "la estrella",
       "el corazón", "la luna"]
for n in FIG:
    cap = n[0].upper() + n[1:]
    P += [f"¡{cap}!", f"Pon {n} en su lugar"]
P += ["¡Casi! ¿Dónde va?"]

# --- colores
COL = ["rojo", "azul", "amarillo", "verde", "rosa"]
for c in COL:
    P += [f"¡{c[0].upper()+c[1:]}!", f"Va con el color {c}", f"Ahí no va. Busca el {c}"]

# --- tamaños
P += ["Lo grande para Cami", "Lo chico para Lola",
      "¡Grande! Para Cami. ¡Gracias!", "¡Chico! Para Lola. ¡Gracias!",
      "Eso es muy chico para Cami", "Eso es muy grande para Lola"]

# --- números
P += ["Lola quiere un quesito. ¡Solo uno!", "Lola quiere dos quesitos. ¡Solo dos!",
      "Lola quiere tres quesitos. ¡Solo tres!",
      "¡Uno!",
      "¡Un quesito! ¡Ñam ñam! ¡Justo lo que quería!",
      "¡Dos quesitos! ¡Ñam ñam! ¡Justo lo que quería!",
      "¡Tres quesitos! ¡Ñam ñam! ¡Justo lo que quería!",
      "¡No, no! Ya comí uno. ¡Gracias, Cami!",
      "¡No, no! Ya comí dos. ¡Gracias, Cami!",
      "¡No, no! Ya comí tres. ¡Gracias, Cami!",
      "Dale el quesito a Lola"]

# --- rompecabezas
ROMPE = ["la casa", "el carrito", "el árbol", "la flor", "el barco"]
for n in ROMPE:
    P += [f"¡Mira, {n}! ¡Lo armaste!"]
P += ["¿Dónde va esta pieza?"]

# --- caminito
P += ["¡Toca el dado, Cami!", "¡Toca el dado!", "¡Otra vez! ¡El dado!",
      "¡Sigue, Cami! ¡Toca el dado!",
      "¡Una mariposa!", "¡Una florecita!", "¡Un pollito! ¡Pío, pío!",
      "¡Una manzana!", "¡Una ranita! ¡Croac, croac!", "¡Un globo!",
      "¡Una fresa!", "¡Música!", "¡Un arcoíris mágico! ¡Brinco extra!",
      "¡Una estrella!", "¡Llegaste a la casita de Lola!"]

# ---------------------------------------------------------------- generación
def norm(t):
    """Misma normalización que Voz._norm en js/tts.js."""
    t = t.lower()
    t = re.sub(r"[¡!¿?.,:;]", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


async def gen_one(sem, text, path):
    async with sem:
        tts = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
        await tts.save(str(path))


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    table = {}   # norm -> (filename, texto original para generar)
    for raw in P:
        k = norm(raw)
        if k and k not in table:
            h = hashlib.md5(k.encode("utf-8")).hexdigest()[:10]
            table[k] = (h + ".mp3", raw)

    sem = asyncio.Semaphore(6)
    jobs, skipped = [], 0
    for k, (fname, raw) in table.items():
        p = OUT / fname
        if p.exists() and p.stat().st_size > 1000:
            skipped += 1
            continue
        jobs.append(gen_one(sem, raw, p))
    print(f"frases únicas: {len(table)} | ya existían: {skipped} | a generar: {len(jobs)}")
    if jobs:
        await asyncio.gather(*jobs)

    # valida que todos los archivos existan
    missing = [k for k, (f, _) in table.items() if not (OUT / f).exists()]
    if missing:
        print("FALTARON:", missing[:10])
        sys.exit(1)

    manifest = {k: "audio/voz/" + f for k, (f, _) in table.items()}
    js = ("/* Generado por tools/gen_voces.py — NO editar a mano.\n"
          "   Voz: " + VOICE + " rate " + RATE + " pitch " + PITCH + " */\n"
          "var VOCES = " + json.dumps(manifest, ensure_ascii=False, indent=0) + ";\n")
    MANIFEST.write_text(js, encoding="utf-8")
    total_kb = sum((OUT / f).stat().st_size for _, (f, _) in table.items()) // 1024
    print(f"OK: {len(table)} frases, {total_kb} KB en audio/voz/, manifiesto js/voces.js")


if __name__ == "__main__":
    asyncio.run(main())
