/* Lamper Soluciones de Acabado · main.js (web v2)
   Sin dependencias. Todo funciona sin JS (menú visible por CSS en escritorio,
   galerías como enlaces a la imagen, comparador con valor inicial). */
(function () {
  "use strict";
  var d = document;
  d.documentElement.classList.remove("sin-js");

  /* Textos según el idioma de la página (<html lang="es|ca">) */
  var CA = (d.documentElement.lang || "").indexOf("ca") === 0;
  var T = CA ? {
    antes: "Abans", despues: "després", una: "Es mostra 1 obra.", varias: "Es mostren {n} obres.",
    dossier: "M’agradaria rebre el dossier de l’empresa.", asunto: "Consulta web (català)",
    tipo: "Tipus de treball", nombre: "Nom", entidad: "Empresa, estudi o comunitat", correo: "Correu",
    tel: "Telèfon", lugar: "Lloc de l’obra", acepto: "Accepto la política de privacitat.",
    ok: 'Hem obert el teu programa de correu amb la consulta preparada: només cal que premis «Envia». Si no s’ha obert, escriu-nos a <a href="mailto:info@lamper.es">info@lamper.es</a>.'
  } : {
    antes: "Antes", despues: "después", una: "Se muestra 1 obra.", varias: "Se muestran {n} obras.",
    dossier: "Me gustaría recibir el dossier de la empresa.", asunto: "Consulta web",
    tipo: "Tipo de trabajo", nombre: "Nombre", entidad: "Empresa, estudio o comunidad", correo: "Correo",
    tel: "Teléfono", lugar: "Lugar de la obra", acepto: "Acepto la política de privacidad.",
    ok: 'Hemos abierto tu programa de correo con la consulta preparada: solo falta pulsar «Enviar». Si no se ha abierto, escríbenos a <a href="mailto:info@lamper.es">info@lamper.es</a>.'
  };

  /* Menú móvil */
  var boton = d.querySelector(".menu-boton");
  var nav = d.getElementById("nav-principal");
  if (boton && nav) {
    boton.addEventListener("click", function () {
      var abierto = boton.getAttribute("aria-expanded") === "true";
      boton.setAttribute("aria-expanded", String(!abierto));
      nav.classList.toggle("abierta", !abierto);
    });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("abierta")) {
        boton.setAttribute("aria-expanded", "false");
        nav.classList.remove("abierta");
        boton.focus();
      }
    });
  }

  /* Comparador antes/después: el control es un input range real (teclado y lectores de pantalla).
     Encima, arrastre con puntero en toda la foto (ratón, dedo, lápiz): iOS solo mueve un range desde
     el pulgar, y con touch-action:pan-y el gesto vertical sigue desplazando la página.
     Teclado: flechas ±5 %, Mayús+flecha ±1 %, Inicio/Fin y RePág/AvPág (nativos). */
  d.querySelectorAll(".comparador:not(.pendiente)").forEach(function (c) {
    var r = c.querySelector("input[type=range]");
    var marco = c.querySelector(".marco");
    if (!r || !marco) return;
    var pinta = function () {
      c.style.setProperty("--pos", r.value + "%");
      r.setAttribute("aria-valuetext", T.antes + " " + r.value + " %, " + T.despues + " " + (100 - r.value) + " %");
    };
    var pon = function (v) { r.value = Math.max(0, Math.min(100, Math.round(v))); pinta(); };
    r.addEventListener("input", pinta);
    r.addEventListener("keydown", function (e) {
      var paso = e.shiftKey ? 1 : 5;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { pon(+r.value - paso); e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { pon(+r.value + paso); e.preventDefault(); }
    });
    var activo = null;
    var aPos = function (e) { var b = marco.getBoundingClientRect(); pon((e.clientX - b.left) / b.width * 100); };
    marco.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      activo = e.pointerId; c.classList.add("arrastrando");
      if (e.pointerType === "mouse") { aPos(e); e.preventDefault(); r.focus({ preventScroll: true }); }
      try { marco.setPointerCapture(e.pointerId); } catch (_) {}
    });
    marco.addEventListener("pointermove", function (e) { if (e.pointerId === activo) aPos(e); });
    var suelta = function (e) {
      if (e.pointerId !== activo) return;
      if (e.type === "pointerup" && e.pointerType !== "mouse") aPos(e);   // un toque también coloca la línea
      activo = null; c.classList.remove("arrastrando");
    };
    marco.addEventListener("pointerup", suelta);
    marco.addEventListener("pointercancel", function (e) { if (e.pointerId === activo) { activo = null; c.classList.remove("arrastrando"); } });
    pinta();
  });

  /* Vídeo con fachada: sin <source> se queda en «pendiente» (sin botón). Con vídeo, el botón lo
     carga y reproduce en el sitio; nada se descarga antes de pulsar. */
  d.querySelectorAll(".video[data-video]").forEach(function (f) {
    var v = f.querySelector("video"), b = f.querySelector(".video-play");
    if (!v || !b || !v.querySelector("source[src]")) return;
    f.classList.remove("pendiente");
    b.hidden = false;
    b.addEventListener("click", function () {
      v.hidden = false; v.controls = true; f.classList.add("reproduciendo");
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      v.focus();
    });
  });

  /* Visor de galería con <dialog>: teclado (Esc, flechas) y cartela */
  var visor = d.getElementById("visor");
  if (visor && typeof visor.showModal === "function") {
    var img = visor.querySelector("img");
    if (!img) { img = d.createElement("img"); img.alt = ""; visor.insertBefore(img, visor.firstChild); }
    var cart = visor.querySelector(".cartela");
    var grupo = [], i = 0, origen = null;
    var muestra = function () {
      var b = grupo[i];
      img.src = b.dataset.grande;
      img.alt = b.querySelector("img").alt;
      cart.innerHTML = b.dataset.cartela || "";
    };
    d.querySelectorAll(".galeria button[data-grande]").forEach(function (b) {
      b.addEventListener("click", function () {
        grupo = Array.prototype.slice.call(b.closest(".galeria").querySelectorAll("button[data-grande]"));
        i = grupo.indexOf(b); origen = b; muestra(); visor.showModal();
      });
    });
    var mueve = function (n) { i = (i + n + grupo.length) % grupo.length; muestra(); };
    visor.querySelector(".cerrar").addEventListener("click", function () { visor.close(); });
    visor.querySelector(".ant").addEventListener("click", function () { mueve(-1); });
    visor.querySelector(".sig").addEventListener("click", function () { mueve(1); });
    visor.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") mueve(-1);
      if (e.key === "ArrowRight") mueve(1);
    });
    visor.addEventListener("click", function (e) { if (e.target === visor) visor.close(); });
    visor.addEventListener("close", function () { if (origen) origen.focus(); });
  }

  /* Filtro del registro de obras: botones con aria-pressed, recuento anunciado */
  d.querySelectorAll("[data-filtros]").forEach(function (f) {
    var lista = d.getElementById(f.getAttribute("data-filtros"));
    var aviso = d.getElementById(f.getAttribute("data-filtros") + "-recuento");
    if (!lista) return;
    var botones = f.querySelectorAll("button[data-filtro]");
    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-filtro"), n = 0;
        botones.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        lista.querySelectorAll("li[data-tipo]").forEach(function (li) {
          var ve = t === "todas" || li.getAttribute("data-tipo") === t;
          li.hidden = !ve; if (ve) n++;
        });
        if (aviso) aviso.textContent = n === 1 ? T.una : T.varias.replace("{n}", n);
      });
    });
  });

  /* Formulario de contacto: ayuda según el tipo de trabajo, validación accesible y envío.
     Sin servidor, el envío prepara un correo a info@lamper.es en el programa de correo.
     En WordPress lo sustituye el plugin de formularios (GUIA_ECOMPUTER.md). */
  var form = d.getElementById("form-contacto");
  if (form) {
    form.noValidate = true;
    var msj = d.getElementById("f-mensaje");
    var guias = form.querySelectorAll(".guia");
    var estado = d.getElementById("estado-form");
    form.querySelectorAll("input[name=tipo]").forEach(function (r) {
      r.addEventListener("change", function () {
        var id = r.getAttribute("data-ayuda");
        guias.forEach(function (g) { g.hidden = g.id !== id; });
        msj.setAttribute("aria-describedby", id + " error-mensaje");
        marca(form.querySelector(".tipo-trabajo"), "error-tipo", true);
      });
    });
    /* Enlaces «contacto/?tipo=…» desde cada público: dejan elegido el tipo de trabajo */
    var pide = (window.location.search.match(/[?&]tipo=([a-z]+)/) || [])[1];
    var aTipo = { industria: "ayuda-industria", comunidades: "ayuda-comunidades", administradores: "ayuda-comunidades", cubiertas: "ayuda-cubiertas", acabados: "ayuda-acabados", reformas: "ayuda-acabados", dossier: "ayuda-comunidades" };
    if (pide && aTipo[pide]) {
      var r0 = form.querySelector('input[data-ayuda="' + aTipo[pide] + '"]');
      if (r0) { r0.checked = true; setTimeout(function () { r0.dispatchEvent(new Event("change")); }, 0); }
      if (pide === "dossier" && !msj.value) msj.value = T.dossier;
    }
    var marca = function (el, idError, ok) {
      el.setAttribute("aria-invalid", String(!ok));
      d.getElementById(idError).hidden = ok;
      return ok;
    };
    var valida = function () {
      var malos = [];
      var tipo = form.querySelector("input[name=tipo]:checked");
      if (!marca(form.querySelector(".tipo-trabajo"), "error-tipo", !!tipo)) malos.push(form.querySelector("input[name=tipo]"));
      [["f-nombre", "error-nombre"], ["f-email", "error-email"], ["f-mensaje", "error-mensaje"]].forEach(function (c) {
        var el = d.getElementById(c[0]);
        var ok = el.value.trim() !== "" && (el.type !== "email" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim()));
        if (!marca(el, c[1], ok)) malos.push(el);
      });
      var priv = form.querySelector("input[name=privacidad]");
      if (!marca(priv, "error-privacidad", priv.checked)) malos.push(priv);
      return malos;
    };
    form.querySelectorAll("input, textarea").forEach(function (el) {
      el.addEventListener("blur", function () { if (el.getAttribute("aria-invalid") === "true") valida(); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var malos = valida();
      if (malos.length) { malos[0].focus(); return; }
      var v = function (n) { var el = form.elements[n]; return el ? (el.value || "").trim() : ""; };
      var tipo = form.querySelector("input[name=tipo]:checked").value;
      var asunto = T.asunto + " · " + tipo + (v("lugar") ? " · " + v("lugar") : "");
      var cuerpo = [T.tipo + ": " + tipo, T.nombre + ": " + v("nombre"),
        v("entidad") ? T.entidad + ": " + v("entidad") : "",
        T.correo + ": " + v("email"), v("telefono") ? T.tel + ": " + v("telefono") : "",
        v("lugar") ? T.lugar + ": " + v("lugar") : "", "", v("mensaje"), "",
        T.acepto].filter(function (l, i, a) { return l !== "" || a[i - 1] !== ""; }).join("\n");
      window.location.href = "mailto:info@lamper.es?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
      estado.innerHTML = '<p class="aviso-ok">' + T.ok + '</p>';
    });
  }

  /* Aparición suave al entrar en pantalla (respeta reduced-motion vía CSS) */
  var els = d.querySelectorAll(".aparece");
  if ("IntersectionObserver" in window && els.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("visto"); });
  }
})();
