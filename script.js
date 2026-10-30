/* Page-specific behavior, isolated to avoid cross-page globals. */
async function llamarApi(accion, datos) {
    if (typeof window.sgdDemoApi !== "function") {
        throw new Error("No se pudo iniciar el modo de demostración en este navegador.");
    }
    return window.sgdDemoApi(accion, datos);
}

if (document.documentElement.classList.contains("page-clientes")) {
    (() => {
const formularioComentario = document.getElementById("formulario-comentario");
    const listaComentarios = document.getElementById("lista-comentarios");
    const estadoComentario = document.getElementById("estado-comentario");
    const claveComentarios = "sgd-comentarios";

    function obtenerComentarios() {
        try {
            const comentarios = JSON.parse(localStorage.getItem(claveComentarios) || "[]");
            return Array.isArray(comentarios) ? comentarios : [];
        } catch {
            return [];
        }
    }

    function crearTarjetaComentario(comentario) {
        const tarjeta = document.createElement("article");
        const rating = document.createElement("div");
        const texto = document.createElement("p");
        const nombre = document.createElement("div");
        const cantidadEstrellas = Math.min(5, Math.max(1, Number(comentario.estrellas) || 1));

        tarjeta.className = "card tarjeta-comentario";
        rating.className = "rating";
        rating.setAttribute("aria-label", `${cantidadEstrellas} de 5 estrellas`);
        rating.textContent = "★".repeat(cantidadEstrellas) + "☆".repeat(5 - cantidadEstrellas);
        texto.className = "feedback";
        texto.textContent = `“${comentario.texto}”`;
        nombre.className = "nombre-empresa";
        nombre.textContent = comentario.nombre;
        tarjeta.append(rating, texto, nombre);

        return tarjeta;
    }

    obtenerComentarios().forEach((comentario) => {
        if (comentario && comentario.nombre && comentario.texto) {
            listaComentarios.appendChild(crearTarjetaComentario(comentario));
        }
    });

    formularioComentario.addEventListener("submit", (event) => {
        event.preventDefault();
        const comentario = {
            nombre: document.getElementById("nombre-comentario").value.trim(),
            estrellas: Number(document.getElementById("estrellas-comentario").value),
            texto: document.getElementById("texto-comentario").value.trim()
        };

        if (!comentario.nombre || !comentario.texto) {
            estadoComentario.textContent = "Completá tu nombre y comentario para publicarlo.";
            return;
        }

        try {
            const comentarios = obtenerComentarios();
            comentarios.unshift(comentario);
            localStorage.setItem(claveComentarios, JSON.stringify(comentarios));
            listaComentarios.prepend(crearTarjetaComentario(comentario));
            formularioComentario.reset();
            estadoComentario.textContent = "Tu comentario se agregó a esta página.";
        } catch {
            estadoComentario.textContent = "No se pudo guardar el comentario en este navegador.";
        }
    });

    const botonTema = document.getElementById("boton-tema");

    function aplicarTema(tema) {
        const oscuro = tema === "oscuro";
        document.body.classList.toggle("tema-oscuro", oscuro);
        try { localStorage.setItem("tema-sgd", tema); } catch {}
        botonTema.textContent = oscuro ? "☀️" : "🌙";
        botonTema.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
    }

    const temaGuardado = localStorage.getItem("tema-sgd") || "claro";
    aplicarTema(temaGuardado);

    botonTema.addEventListener("click", () => {
        const nuevoTema = document.body.classList.contains("tema-oscuro") ? "claro" : "oscuro";
        aplicarTema(nuevoTema);
    });
    })();
}

if (document.documentElement.classList.contains("page-cuenta")) {
    (() => {
        function volverTrasAutenticacion() {
            const destino = new URLSearchParams(window.location.search).get("return");
            window.location.replace(["guardadata.html", "diagnostico.html"].includes(destino) ? destino : "index.html");
        }

        llamarApi("me").then(volverTrasAutenticacion).catch(() => {
            document.documentElement.classList.remove("cuenta-autenticando");
        });
        function iniciarPlanetaCuenta() {
            const canvas = document.getElementById("planeta-cuenta");
            const context = canvas?.getContext("2d");
            if (!canvas || !context) return;

            const masasTerrestres = [
                [[-168, 65], [-150, 70], [-130, 70], [-100, 75], [-70, 70], [-60, 50], [-75, 40], [-80, 25], [-90, 18], [-105, 20], [-115, 30], [-125, 50], [-140, 60]],
                [[-80, 10], [-65, 10], [-35, -5], [-38, -20], [-55, -35], [-68, -55], [-75, -45], [-72, -18], [-80, 0]],
                [[-10, 36], [0, 42], [10, 45], [15, 55], [25, 70], [40, 65], [30, 45], [20, 38], [10, 38]],
                [[-17, 32], [10, 37], [32, 30], [42, 12], [51, 10], [40, -10], [33, -34], [18, -34], [12, -5], [-15, 12]],
                [[40, 65], [60, 70], [100, 75], [140, 70], [170, 60], [140, 35], [120, 30], [105, 10], [80, 8], [65, 25], [50, 30], [40, 40]],
                [[114, -22], [130, -12], [142, -12], [153, -28], [148, -38], [138, -35], [115, -34]],
                [[-180, -78], [-120, -75], [-60, -75], [0, -72], [60, -75], [120, -75], [180, -78]]
            ];
            const nodos = [[-74, 40], [-3, 40], [139, 35], [-58, -34], [151, -33]];
            const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)");
            let ancho = 0;
            let alto = 0;
            let rotacion = -18;
            let fotograma = 0;

            function proyectar(longitud, latitud, radio) {
                const longitudRad = (longitud + rotacion) * Math.PI / 180;
                const latitudRad = latitud * Math.PI / 180;
                return {
                    x: radio * Math.cos(latitudRad) * Math.sin(longitudRad),
                    y: -radio * Math.sin(latitudRad),
                    z: Math.cos(latitudRad) * Math.cos(longitudRad)
                };
            }

            function dibujar() {
                if (!ancho || !alto) return;
                context.clearRect(0, 0, ancho, alto);

                const oscuro = document.body.getAttribute("data-theme") === "dark";
                const colorResplandor = oscuro ? "rgba(34, 211, 238, .22)" : "rgba(37, 99, 235, .16)";
                const colorMalla = oscuro ? "rgba(103, 232, 249, .52)" : "rgba(37, 99, 235, .38)";
                const colorTierra = oscuro ? "rgba(163, 230, 53, .95)" : "rgba(16, 185, 129, .95)";
                const colorBorde = oscuro ? "rgba(34, 211, 238, .9)" : "rgba(37, 99, 235, .72)";
                const centroX = ancho / 2;
                const centroY = alto / 2;
                const radio = Math.min(ancho, alto) * .48;
                const resplandor = context.createRadialGradient(centroX, centroY, radio * .55, centroX, centroY, radio * 1.45);
                resplandor.addColorStop(0, colorResplandor);
                resplandor.addColorStop(.7, oscuro ? "rgba(163, 230, 53, .16)" : "rgba(16, 185, 129, .12)");
                resplandor.addColorStop(1, "rgba(37, 99, 235, 0)");
                context.fillStyle = resplandor;
                context.fillRect(0, 0, ancho, alto);

                context.save();
                context.beginPath();
                context.arc(centroX, centroY, radio, 0, Math.PI * 2);
                context.clip();
                context.fillStyle = oscuro ? "rgba(34, 211, 238, .12)" : "rgba(37, 99, 235, .08)";
                context.fillRect(centroX - radio, centroY - radio, radio * 2, radio * 2);

                context.strokeStyle = colorMalla;
                context.lineWidth = 1;
                for (let longitud = 0; longitud < 180; longitud += 30) {
                    context.beginPath();
                    let trazoActivo = false;
                    for (let latitud = -90; latitud <= 90; latitud += 4) {
                        const punto = proyectar(longitud, latitud, radio);
                        if (punto.z > 0) {
                            if (!trazoActivo) context.moveTo(centroX + punto.x, centroY + punto.y);
                            else context.lineTo(centroX + punto.x, centroY + punto.y);
                            trazoActivo = true;
                        } else {
                            trazoActivo = false;
                        }
                    }
                    context.stroke();
                }

                for (let latitud = -60; latitud <= 60; latitud += 30) {
                    context.beginPath();
                    let trazoActivo = false;
                    for (let longitud = -180; longitud <= 180; longitud += 4) {
                        const punto = proyectar(longitud, latitud, radio);
                        if (punto.z > 0) {
                            if (!trazoActivo) context.moveTo(centroX + punto.x, centroY + punto.y);
                            else context.lineTo(centroX + punto.x, centroY + punto.y);
                            trazoActivo = true;
                        } else {
                            trazoActivo = false;
                        }
                    }
                    context.stroke();
                }

                context.strokeStyle = colorTierra;
                context.lineWidth = 1.8;
                masasTerrestres.forEach((coordenadas) => {
                    context.beginPath();
                    let trazoActivo = false;
                    coordenadas.forEach((coordenada, indice) => {
                        const siguiente = coordenadas[(indice + 1) % coordenadas.length];
                        for (let paso = 0; paso <= 12; paso += 1) {
                            if (indice > 0 && paso === 0) continue;
                            const fraccion = paso / 12;
                            const longitud = coordenada[0] + (siguiente[0] - coordenada[0]) * fraccion;
                            const latitud = coordenada[1] + (siguiente[1] - coordenada[1]) * fraccion;
                            const punto = proyectar(longitud, latitud, radio);
                            if (punto.z > 0) {
                                if (!trazoActivo) context.moveTo(centroX + punto.x, centroY + punto.y);
                                else context.lineTo(centroX + punto.x, centroY + punto.y);
                                trazoActivo = true;
                            } else {
                                trazoActivo = false;
                            }
                        }
                    });
                    context.stroke();
                });

                nodos.forEach(([longitud, latitud]) => {
                    const punto = proyectar(longitud, latitud, radio);
                    if (punto.z <= 0) return;
                    const x = centroX + punto.x;
                    const y = centroY + punto.y;
                    context.beginPath();
                    context.arc(x, y, 4, 0, Math.PI * 2);
                    context.strokeStyle = "rgba(245, 158, 11, .45)";
                    context.stroke();
                    context.beginPath();
                    context.arc(x, y, 2, 0, Math.PI * 2);
                    context.fillStyle = "#f59e0b";
                    context.fill();
                });
                context.restore();

                context.beginPath();
                context.arc(centroX, centroY, radio, 0, Math.PI * 2);
                context.strokeStyle = colorBorde;
                context.lineWidth = 2;
                context.stroke();
            }

            function ajustarCanvas() {
                const caja = canvas.getBoundingClientRect();
                const escala = Math.min(window.devicePixelRatio || 1, 2);
                ancho = caja.width;
                alto = caja.height;
                canvas.width = Math.max(1, Math.round(ancho * escala));
                canvas.height = Math.max(1, Math.round(alto * escala));
                context.setTransform(escala, 0, 0, escala, 0, 0);
                dibujar();
            }

            function puedeAnimar() {
                return !document.documentElement.classList.contains("animaciones-deshabilitadas")
                    && !movimientoReducido.matches
                    && !document.hidden;
            }

            function animar() {
                if (!puedeAnimar()) {
                    fotograma = 0;
                    dibujar();
                    return;
                }
                rotacion = (rotacion + .16) % 360;
                dibujar();
                fotograma = window.requestAnimationFrame(animar);
            }

            function actualizarAnimacion() {
                if (fotograma) window.cancelAnimationFrame(fotograma);
                fotograma = 0;
                dibujar();
                if (puedeAnimar()) fotograma = window.requestAnimationFrame(animar);
            }

            ajustarCanvas();
            new MutationObserver(dibujar).observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
            if ("ResizeObserver" in window) new ResizeObserver(ajustarCanvas).observe(canvas.parentElement);
            else window.addEventListener("resize", ajustarCanvas, { passive: true });
            document.addEventListener("visibilitychange", actualizarAnimacion);
            if (movimientoReducido.addEventListener) movimientoReducido.addEventListener("change", actualizarAnimacion);
            actualizarAnimacion();
        }

        iniciarPlanetaCuenta();

function mostrarFormulario(tipo) {
            const login = document.getElementById("form-login");
            const registro = document.getElementById("form-registro");
            const botones = document.querySelectorAll(".boton-tipo");

            const mostrarLogin = tipo === "login";

            login.classList.toggle("activo", mostrarLogin);
            registro.classList.toggle("activo", !mostrarLogin);
            login.setAttribute("aria-hidden", String(!mostrarLogin));
            registro.setAttribute("aria-hidden", String(mostrarLogin));
            botones.forEach((boton) => {
                const activo = boton.dataset.formulario === tipo;
                boton.classList.toggle("activo", activo);
                boton.setAttribute("aria-selected", String(activo));
            });
        }

        document.getElementById("form-registro").addEventListener("submit", async function(event) {
            event.preventDefault();
            const estado = document.getElementById("estado-registro");
            const password = document.getElementById("registro-password").value;
            if (password !== document.getElementById("registro-confirmar").value) {
                estado.textContent = "Las contraseñas no coinciden.";
                return;
            }
            try {
                await llamarApi("register", {
                    nombre: document.getElementById("registro-nombre").value.trim(),
                    apellido: document.getElementById("registro-apellido").value.trim(),
                    empresa: document.getElementById("registro-empresa").value.trim(),
                    correo: document.getElementById("registro-correo").value.trim().toLowerCase(),
                    contrasena: password,
                    condicionesAceptadas: document.getElementById("terminos").checked
                });
                volverTrasAutenticacion();
            } catch (error) {
                estado.textContent = error.message || "No se pudo crear la cuenta.";
            }
        });

        document.getElementById("form-login").addEventListener("submit", async function(event) {
            event.preventDefault();
            const correo = document.getElementById("login-correo").value.trim().toLowerCase();
            const password = document.getElementById("login-password").value;
            const estado = document.getElementById("estado-cuenta-form");
            try {
                await llamarApi("login", { correo, contrasena: password });
                volverTrasAutenticacion();
            } catch (error) {
                estado.textContent = error.message || "El correo o la contraseña no son correctos.";
            }
        });

        document.getElementById("boton-google").disabled = true;
        document.getElementById("boton-google").addEventListener("click", () => {
            document.getElementById("estado-cuenta-form").textContent = "El acceso con Google no está disponible en esta demostración estática.";
        });

    const hash = window.location.hash;

    if (hash === "#registro") {
        mostrarFormulario("registro");
    }

    const botonTema = document.getElementById("boton-tema");

    function actualizarTema(tema) {
        const oscuro = tema === "oscuro";
        document.body.classList.toggle("tema-oscuro", oscuro);
        document.body.setAttribute("data-theme", oscuro ? "dark" : "light");
        document.documentElement.setAttribute("data-theme", oscuro ? "dark" : "light");
        localStorage.setItem("tema-sgd", tema);

        botonTema.textContent = oscuro ? "☀️" : "🌙";
        botonTema.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
        botonTema.setAttribute("aria-pressed", String(oscuro));
    }

    const temaGuardado = localStorage.getItem("tema-sgd") || "claro";
    actualizarTema(temaGuardado);

    botonTema.addEventListener("click", () => {
        const oscuro = document.body.getAttribute("data-theme") === "dark";
        actualizarTema(oscuro ? "claro" : "oscuro");
    });
        document.querySelectorAll(".boton-tipo").forEach((boton, indice) => {
            boton.addEventListener("click", () => mostrarFormulario(indice === 0 ? "login" : "registro"));
        });
    })();
}

if (document.documentElement.classList.contains("page-diagnostico")) {
    (() => {
const formulario = document.getElementById("formulario");
const contenidoFormulario = document.getElementById("formulario-contenido");
const mensajeExito = document.getElementById("mensaje-exito");
const claveServiciosSeleccionados = "sgd-servicios-seleccionados";
let serviciosSeleccionados = [];
try {
    const serviciosGuardados = JSON.parse(sessionStorage.getItem(claveServiciosSeleccionados) || "[]");
    if (Array.isArray(serviciosGuardados)) serviciosSeleccionados = serviciosGuardados;
} catch {}
if (serviciosSeleccionados.length) {
    const resumenServicios = document.getElementById("servicios-seleccionados-resumen");
    resumenServicios.textContent = `Servicios seleccionados: ${serviciosSeleccionados.map((servicio) => `${servicio.nombre}${servicio.cantidad > 1 ? ` × ${servicio.cantidad}` : ""}`).join(", ")}.`;
    resumenServicios.hidden = false;
}

formulario.addEventListener("submit", function(event) {
    event.preventDefault();

    const datosDiagnostico = Object.fromEntries(new FormData(formulario).entries());
    const tienePromocionSolicitada = new URLSearchParams(window.location.search).get("promocion") === "10";
    const ventanaPromocionalMs = 7 * 24 * 60 * 60 * 1000;
    const inicioPromocion = Date.parse(serviciosSeleccionados[0]?.promocionInicio || "");
    const promocionVigente = tienePromocionSolicitada
        && serviciosSeleccionados.length > 0
        && serviciosSeleccionados.every((servicio) => servicio.promocion === true)
        && Number.isFinite(inicioPromocion)
        && Date.now() >= inicioPromocion
        && Date.now() - inicioPromocion <= ventanaPromocionalMs;
    const consentimientoJuridico = {
        version: "2026-10-15",
        fecha: new Date().toISOString(),
        contenidoSensible: datosDiagnostico.consentimientoSensible === "acepto",
        avisoAutoridades: datosDiagnostico.avisoAutoridades === "leido",
        condiciones: datosDiagnostico.aceptacionCondiciones === "leido"
    };

    sessionStorage.setItem("sgd-solicitud-diagnostico", JSON.stringify({
        ...datosDiagnostico,
        serviciosSeleccionados,
        consentimientoJuridico,
        promocion: promocionVigente,
        promocionSolicitada: tienePromocionSolicitada && serviciosSeleccionados.some((servicio) => servicio.promocion === true),
        fechaSolicitud: new Date().toISOString()
    }));
    localStorage.setItem("sgd-consentimiento-juridico", JSON.stringify(consentimientoJuridico));

    contenidoFormulario.style.display = "none";
    document.querySelector("#mensaje-exito h2").textContent = "¡Diagnóstico preparado!";
    document.querySelector("#mensaje-exito p").textContent = "La información quedó guardada temporalmente en este navegador. No se envió al equipo de S.G.D.; podés continuar para preparar el resumen de la solicitud.";
    mensajeExito.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

const botonArriba = document.getElementById("volver-arriba");

window.addEventListener("scroll", () => {
    botonArriba.classList.toggle("mostrar", window.scrollY > 400);
});

botonArriba.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

const botonTema = document.getElementById("boton-tema");

function aplicarTema(tema) {
    const oscuro = tema === "oscuro";

    document.body.classList.toggle("tema-oscuro", oscuro);
    document.body.setAttribute("data-theme", oscuro ? "dark" : "light");
    localStorage.setItem("tema-sgd", tema);

    botonTema.textContent = oscuro ? "☀️" : "🌙";
    botonTema.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
}

const temaGuardado = localStorage.getItem("tema-sgd") || "claro";
aplicarTema(temaGuardado);

botonTema.addEventListener("click", () => {
    const temaActual = document.body.classList.contains("tema-oscuro")
        ? "oscuro"
        : "claro";

    aplicarTema(temaActual === "oscuro" ? "claro" : "oscuro");
});
    })();
}

if (document.documentElement.classList.contains("page-index")) {
    (() => {
// Menú móvil
    const menuToggle = document.getElementById("menu-toggle");
    const links = document.getElementById("links");
    const botonCuenta = document.getElementById("boton-cuenta");
    const panelCuenta = document.getElementById("panel-cuenta");
    const fondoCuenta = document.getElementById("cuenta-fondo");
    const cerrarPanelCuenta = document.getElementById("cerrar-panel-cuenta");
    const enlaceIniciarSesion = document.getElementById("abrir-login");
    const enlaceCrearCuenta = document.getElementById("crear-cuenta");
    const botonCerrarSesion = document.getElementById("cerrar-sesion");
    const enlaceConfiguracion = document.getElementById("abrir-configuracion");
    let overflowAnterior = "";
    let temporizadorCierrePanel;

    async function actualizarPanelCuenta() {
        let perfil = null;
        let consentimiento = null;
        try {
            consentimiento = JSON.parse(localStorage.getItem("sgd-consentimiento-juridico") || "null");
        } catch {}

        try {
            perfil = (await llamarApi("me")).perfil;
        } catch {}
        const sesionActiva = Boolean(perfil);
        document.getElementById("cuenta-estado").textContent = sesionActiva ? "Perfil activo" : "Sin sesión iniciada";
        document.getElementById("cuenta-nombre").textContent = sesionActiva ? `${perfil.nombre} ${perfil.apellido}`.trim() : "Visitante";
        document.getElementById("cuenta-empresa").textContent = sesionActiva ? (perfil.empresa || "Sin empresa vinculada") : "Sin vincular";
        document.getElementById("cuenta-correo").textContent = sesionActiva ? perfil.correo : "No disponible";
        enlaceIniciarSesion.hidden = sesionActiva;
        enlaceCrearCuenta.hidden = sesionActiva;
        botonCerrarSesion.hidden = !sesionActiva;
        enlaceConfiguracion.hidden = !sesionActiva;

        const estadoConsentimiento = document.getElementById("estado-consentimiento");
        estadoConsentimiento.textContent = consentimiento?.version
            ? `Aceptado el ${new Date(consentimiento.fecha).toLocaleDateString("es-AR")}. Podés consultar las condiciones vigentes.`
            : "No hay consentimientos de servicio registrados en este navegador.";
    }

    async function abrirPanelCuenta() {
        if (botonCuenta.disabled || (!panelCuenta.hidden && panelCuenta.classList.contains("abierto"))) return;
        botonCuenta.disabled = true;
        window.clearTimeout(temporizadorCierrePanel);
        if (panelCuenta.hidden) {
            overflowAnterior = document.body.style.overflow;
        }
        document.body.style.overflow = "hidden";
        panelCuenta.hidden = false;
        fondoCuenta.hidden = false;
        panelCuenta.setAttribute("aria-hidden", "false");
        botonCuenta.setAttribute("aria-expanded", "true");
        panelCuenta.classList.remove("abierto");
        fondoCuenta.classList.remove("abierto");
        panelCuenta.offsetWidth;
        panelCuenta.classList.add("abierto");
        fondoCuenta.classList.add("abierto");
        cerrarPanelCuenta.focus();
        botonCuenta.disabled = false;
        await actualizarPanelCuenta();
    }

    function cerrarPanel() {
        panelCuenta.classList.remove("abierto");
        fondoCuenta.classList.remove("abierto");
        panelCuenta.setAttribute("aria-hidden", "true");
        botonCuenta.setAttribute("aria-expanded", "false");
        document.body.style.overflow = overflowAnterior;
        const duracionTransicion = getComputedStyle(panelCuenta).transitionDuration
            .split(",")
            .map((duracion) => {
                const valor = parseFloat(duracion);
                return duracion.trim().endsWith("ms") ? valor : valor * 1000;
            })
            .reduce((mayor, duracion) => Math.max(mayor, duracion), 0);
        window.clearTimeout(temporizadorCierrePanel);
        temporizadorCierrePanel = window.setTimeout(() => {
            panelCuenta.hidden = true;
            fondoCuenta.hidden = true;
            botonCuenta.focus();
        }, duracionTransicion);
    }

    botonCuenta.addEventListener("click", abrirPanelCuenta);
    cerrarPanelCuenta.addEventListener("click", cerrarPanel);
    fondoCuenta.addEventListener("click", cerrarPanel);
    botonCerrarSesion.addEventListener("click", async () => {
        if (botonCerrarSesion.disabled) return;
        try {
            await llamarApi("logout", {});
            await actualizarPanelCuenta();
        } catch {
            document.getElementById("cuenta-estado").textContent = "No se pudo cerrar la sesión. Intentá nuevamente.";
        }
    });

    document.addEventListener("keydown", (event) => {
        if (panelCuenta.hidden) return;
        if (event.key === "Escape") {
            cerrarPanel();
            return;
        }
        if (event.key === "Tab") {
            const controles = [...panelCuenta.querySelectorAll("a[href], button:not([disabled])")];
            const primero = controles[0];
            const ultimo = controles[controles.length - 1];
            if (event.shiftKey && document.activeElement === primero) {
                event.preventDefault();
                ultimo.focus();
            } else if (!event.shiftKey && document.activeElement === ultimo) {
                event.preventDefault();
                primero.focus();
            }
        }
    });

    if (menuToggle && links) {
        menuToggle.addEventListener("click", () => {
            links.classList.toggle("mostrar");
        });
    }

    // Preguntas frecuentes
    const preguntas = document.querySelectorAll(".faq-pregunta");

    preguntas.forEach((pregunta) => {
        pregunta.addEventListener("click", () => {
            const item = pregunta.closest(".faq-item");

            document.querySelectorAll(".faq-item").forEach((otroItem) => {
                if (otroItem !== item) {
                    otroItem.classList.remove("activo");
                }
            });

            item.classList.toggle("activo");
        });
    });

    // Botón volver arriba
    const botonArriba = document.getElementById("volver-arriba");

    window.addEventListener("scroll", () => {
        botonArriba.classList.toggle("mostrar", window.scrollY > 400);
    });

    botonArriba.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    // Tema claro y oscuro
    const botonTema = document.getElementById("boton-tema");

    function cambiarTema(tema, animar = true) {
        const transicion = document.getElementById("transicion-tema");
        const oscuro = tema === "oscuro";

        document.body.classList.toggle("tema-oscuro", oscuro);
        localStorage.setItem("tema-sgd", tema);
        botonTema.textContent = oscuro ? "☀️" : "🌙";
        botonTema.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
        transicion.style.background = oscuro ? "#0b0e13" : "#f6f9fd";

        if (!animar) return;

        transicion.classList.add("animando");

        setTimeout(() => {
            transicion.classList.remove("animando");
        }, 110);

    }

    botonTema.addEventListener("click", () => {
        cambiarTema(document.body.classList.contains("tema-oscuro") ? "claro" : "oscuro");
    });

    // Recuperar tema guardado
    const temaGuardado = localStorage.getItem("tema-sgd");

    cambiarTema(temaGuardado || "claro", false);
    const fotos = document.querySelectorAll(".foto img");
const visor = document.getElementById("visor-foto");
const fotoAmpliada = document.getElementById("foto-ampliada");
const cerrarVisor = document.getElementById("cerrar-visor");

if (visor && fotoAmpliada && cerrarVisor) {
    fotos.forEach((foto) => {
        foto.addEventListener("click", () => {
            fotoAmpliada.src = foto.src;
            fotoAmpliada.alt = foto.alt;
            visor.classList.add("mostrar");
            document.body.style.overflow = "hidden";
        });
    });

    function cerrarFoto() {
        visor.classList.remove("mostrar");
        document.body.style.overflow = "";
    }

    cerrarVisor.addEventListener("click", cerrarFoto);

    visor.addEventListener("click", (event) => {
        if (event.target === visor) {
            cerrarFoto();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            cerrarFoto();
        }
    });
}
    })();
}

if (document.documentElement.classList.contains("page-precios")) {
    (() => {
        const claveServiciosSeleccionados = "sgd-servicios-seleccionados";
        const selectoresServicio = [...document.querySelectorAll(".servicio-seleccionado")];
        const cantidadesServicio = [...document.querySelectorAll(".cantidad-servicio-input")];
        const botonContinuar = document.getElementById("continuar-servicios");
        const resumenSeleccion = document.getElementById("resumen-seleccion");
        const estadoPromocion = document.getElementById("estado-promocion");
        const notaPromocion = document.getElementById("nota-promocion-precios");
        const formatoPrecio = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
        let promocionActiva = false;
        let inicioPromocion = null;
        let consultaSesionTerminada = false;
        let mensajeErrorSesion = "";

        function precioPromocional(precio) {
            return Math.round(precio * 0.9);
        }

        function obtenerCantidad(id) {
            const campo = cantidadesServicio.find((input) => input.dataset.cantidadPara === id);
            const cantidad = Number(campo?.value ?? 0);
            return Number.isSafeInteger(cantidad) && cantidad >= 0 && cantidad <= 999 ? cantidad : 0;
        }
        cantidadesServicio.forEach((campo) => {
            campo.max = "999";
            campo.setCustomValidity("");
        });

        function actualizarPrecios() {
            document.querySelectorAll(".tarjeta").forEach((tarjeta) => {
                const selector = tarjeta.querySelector(".servicio-seleccionado");
                if (!selector) return;
                const base = Number(selector.dataset.precioOriginal);
                const precio = promocionActiva ? precioPromocional(base) : base;
                const textoBase = tarjeta.querySelector("[data-precio-base]");
                const textoActual = tarjeta.querySelector("[data-precio-actual]");
                const detalle = tarjeta.querySelector("[data-detalle-precio]");
                textoBase.classList.toggle("precio-tachado", promocionActiva);
                textoBase.classList.toggle("precio-base", !promocionActiva);
                textoBase.textContent = `${promocionActiva ? "Precio base" : "Precio base orientativo"}: ${formatoPrecio.format(base)}`;
                textoActual.textContent = formatoPrecio.format(precio);
                detalle.textContent = promocionActiva ? "Precio con 10% de descuento por unidad" : "Precio base orientativo por unidad";
            });
            estadoPromocion.hidden = !promocionActiva && !mensajeErrorSesion;
            if (mensajeErrorSesion) estadoPromocion.textContent = mensajeErrorSesion;
            notaPromocion.textContent = promocionActiva
                ? "El descuento del 10% está disponible durante 7 días desde la primera visita a Precios en este navegador. No necesitás iniciar sesión. Tarifas por unidad; el presupuesto final se confirma antes de contratar."
                : inicioPromocion
                    ? "El plazo de la promoción venció. Se muestran los precios base orientativos por unidad."
                    : "Los precios publicados son bases orientativas por unidad. No se pudo comprobar la promoción en este navegador.";
        }

        function obtenerServiciosSeleccionados() {
            return selectoresServicio
                .filter((selector) => selector.checked && obtenerCantidad(selector.dataset.id) > 0)
                .map((selector) => ({
                    id: selector.dataset.id,
                    nombre: selector.dataset.nombre,
                    precioOriginal: Number(selector.dataset.precioOriginal),
                    precioPromocional: precioPromocional(Number(selector.dataset.precioOriginal)),
                    cantidad: obtenerCantidad(selector.dataset.id),
                    promocion: promocionActiva,
                    promocionInicio: inicioPromocion
                }));
        }

        function actualizarSeleccion() {
            const servicios = obtenerServiciosSeleccionados();
            const totalUnidades = servicios.reduce((total, servicio) => total + servicio.cantidad, 0);
            const cantidadInvalida = cantidadesServicio.some((campo) => !campo.validity.valid);
            botonContinuar.disabled = !consultaSesionTerminada || servicios.length === 0 || cantidadInvalida;
            botonContinuar.textContent = !consultaSesionTerminada
                ? "Comprobando precios…"
                : cantidadInvalida
                    ? "Revisá las cantidades (máximo 999 por servicio)"
                : totalUnidades
                ? `Continuar con ${totalUnidades} unidad${totalUnidades === 1 ? "" : "es"}`
                : "Seleccioná al menos un servicio";
            resumenSeleccion.textContent = cantidadInvalida
                ? "Cada servicio admite una cantidad entera entre 0 y 999."
                : servicios.length
                ? servicios.map((servicio) => `${servicio.nombre} × ${servicio.cantidad}: ${formatoPrecio.format(servicio.precioOriginal * servicio.cantidad)}${servicio.promocion ? ` (con descuento: ${formatoPrecio.format(servicio.precioPromocional * servicio.cantidad)})` : ""}`).join(" · ")
                : "Todavía no agregaste servicios.";
        }

        try {
            const guardados = JSON.parse(sessionStorage.getItem(claveServiciosSeleccionados) || "[]");
            if (Array.isArray(guardados)) {
                const cantidadesGuardadas = new Map(guardados.map((servicio) => [servicio?.id, servicio?.cantidad]));
                selectoresServicio.forEach((selector) => {
                    const cantidad = cantidadesGuardadas.get(selector.dataset.id);
                    if (Number.isSafeInteger(cantidad) && cantidad > 0 && cantidad <= 999) {
                        selector.checked = true;
                        const campo = cantidadesServicio.find((input) => input.dataset.cantidadPara === selector.dataset.id);
                        if (campo) campo.value = String(cantidad);
                    }
                });
            }
        } catch {}
        selectoresServicio.forEach((selector) => selector.addEventListener("change", () => {
            const campo = cantidadesServicio.find((input) => input.dataset.cantidadPara === selector.dataset.id);
            if (campo) campo.value = selector.checked ? String(Math.max(1, Number(campo.value) || 0)) : "0";
            actualizarSeleccion();
        }));
        cantidadesServicio.forEach((campo) => campo.addEventListener("input", () => {
            const cantidad = Number(campo.value);
            campo.setCustomValidity(Number.isSafeInteger(cantidad) && cantidad >= 0 && cantidad <= 999
                ? ""
                : "Ingresá una cantidad entera entre 0 y 999.");
            const selector = selectoresServicio.find((item) => item.dataset.id === campo.dataset.cantidadPara);
            if (selector) selector.checked = Number.isSafeInteger(cantidad) && cantidad > 0 && cantidad <= 999;
            actualizarSeleccion();
        }));
        actualizarSeleccion();

        botonContinuar.addEventListener("click", () => {
            const servicios = obtenerServiciosSeleccionados();
            if (!servicios.length) return;
            try {
                sessionStorage.setItem(claveServiciosSeleccionados, JSON.stringify(servicios));
            } catch {
                resumenSeleccion.textContent = "No se pudo guardar la selección en este navegador. Habilitá el almacenamiento e intentá nuevamente.";
                return;
            }
            window.location.href = `diagnostico.html?promocion=${promocionActiva ? "10" : "0"}`;
        });

        try {
            inicioPromocion = window.sgdDemoPromocionInicio();
            promocionActiva = window.sgdDemoPromocionActiva(inicioPromocion);
        } catch (error) {
            mensajeErrorSesion = `No se pudo comprobar la promoción: ${error.message}`;
        }
        consultaSesionTerminada = true;
        actualizarPrecios();
        actualizarSeleccion();

        const botonTema = document.getElementById("boton-tema");
        const iconoTema = document.getElementById("icono-tema");
        const transicion = document.getElementById("transicion-tema");

        function aplicarTema(tema) {
            const oscuro = tema === "oscuro";
            document.body.classList.toggle("tema-oscuro", oscuro);
            localStorage.setItem("tema-sgd", tema);
            iconoTema.className = oscuro ? "fa-solid fa-sun" : "fa-solid fa-moon";
            botonTema.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
            transicion.style.background = oscuro ? "#0b0e13" : "#f6f9fd";
        }

        const temaGuardado = localStorage.getItem("tema-sgd") || "claro";
        aplicarTema(temaGuardado);

        botonTema.addEventListener("click", () => {
            const temaActual = document.body.classList.contains("tema-oscuro") ? "oscuro" : "claro";
            const nuevoTema = temaActual === "oscuro" ? "claro" : "oscuro";
            
            // Animación de transición similar a la de index.html
            transicion.classList.add("animando");

            setTimeout(() => {
                aplicarTema(nuevoTema);
                requestAnimationFrame(() => transicion.classList.remove("animando"));
            }, 120);
        });
    })();
}

if (document.documentElement.classList.contains("page-recuperar-password")
    && !document.documentElement.classList.contains("page-restablecer-password")) {
    (() => {
        const formularioRecuperacion = document.getElementById('formulario-recuperacion');
        const panelConfirmacion = document.getElementById('panel-confirmacion');
        const botonTema = document.getElementById('boton-tema');
        const formulario = document.getElementById('form-recuperar');
        const estado = document.getElementById('estado-recuperacion');

        function cambiarTema(tema) {
            const oscuro = tema === 'oscuro';
            document.body.setAttribute('data-theme', oscuro ? 'dark' : 'light');
            try { localStorage.setItem('tema-sgd', tema); } catch {}
            botonTema.textContent = oscuro ? '☀️' : '🌙';
            botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
        }

        let temaGuardado = 'claro';
        try { temaGuardado = localStorage.getItem('tema-sgd') || 'claro'; } catch {}
        cambiarTema(temaGuardado);

        botonTema.addEventListener('click', () => {
            const oscuro = document.body.getAttribute('data-theme') === 'dark';
            cambiarTema(oscuro ? 'claro' : 'oscuro');
        });

        formulario.addEventListener('submit', async (event) => {
            event.preventDefault();
            const boton = formulario.querySelector('button[type="submit"]');
            boton.disabled = true;
            estado.textContent = 'Enviando la solicitud…';
            try {
                await llamarApi('password-reset-request', {
                    correo: document.getElementById('correo').value.trim()
                });
                formularioRecuperacion.style.display = 'none';
                panelConfirmacion.style.display = 'block';
            } catch (error) {
                estado.textContent = error.message || 'No se pudo enviar la solicitud. Intentá nuevamente más tarde.';
            } finally {
                boton.disabled = false;
            }
        });
    })();
}

if (document.documentElement.classList.contains("page-restablecer-password")) {
    (() => {
        const formulario = document.getElementById('form-restablecer');
        const confirmacion = document.getElementById('confirmacion-restablecer');
        const estado = document.getElementById('estado-restablecer');
        const botonTema = document.getElementById('boton-tema');
        const token = new URLSearchParams(window.location.search).get('token');

        function cambiarTema(tema) {
            const oscuro = tema === 'oscuro';
            document.body.setAttribute('data-theme', oscuro ? 'dark' : 'light');
            try { localStorage.setItem('tema-sgd', tema); } catch {}
            botonTema.textContent = oscuro ? '☀️' : '🌙';
            botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
        }

        let temaGuardado = 'claro';
        try { temaGuardado = localStorage.getItem('tema-sgd') || 'claro'; } catch {}
        cambiarTema(temaGuardado);
        botonTema.addEventListener('click', () => {
            cambiarTema(document.body.getAttribute('data-theme') === 'dark' ? 'claro' : 'oscuro');
        });

        formulario.addEventListener('submit', async (event) => {
            event.preventDefault();
            const nueva = document.getElementById('nueva-contrasena').value;
            const confirmar = document.getElementById('confirmar-contrasena').value;
            const boton = formulario.querySelector('button[type="submit"]');
            if (!token) {
                estado.textContent = 'Falta el enlace de recuperación. Solicitá uno nuevo.';
                return;
            }
            if (nueva !== confirmar) {
                estado.textContent = 'Las contraseñas no coinciden.';
                return;
            }
            boton.disabled = true;
            estado.textContent = 'Guardando la contraseña…';
            try {
                await llamarApi('password-reset-complete', { token, nueva });
                formulario.style.display = 'none';
                confirmacion.style.display = 'block';
                window.history.replaceState(null, '', window.location.pathname);
            } catch (error) {
                estado.textContent = error.message || 'No se pudo cambiar la contraseña. Solicitá un enlace nuevo.';
            } finally {
                boton.disabled = false;
            }
        });
    })();
}

if (document.documentElement.classList.contains("page-solicitud-servicio")) {
    (() => {
const claveDiagnostico = "sgd-solicitud-diagnostico";
        const ventanaPromocional = 7 * 24 * 60 * 60 * 1000;
        const formulario = document.getElementById("formulario-servicio");
        const diasServicio = document.getElementById("dias-servicio");
        const medioDigital = document.getElementById("medio-digital");
        const medioPresencial = document.getElementById("medio-presencial");
        const cuotas = document.getElementById("cuotas");
        const detallePago = document.getElementById("detalle-pago");
        const notaPromocion = document.getElementById("nota-promocion");
        const fechaUnica = document.getElementById("fecha-servicio-unico");
        const fechasMultiples = document.getElementById("fechas-servicios-multiples");
        const listaFechasServicios = document.getElementById("lista-fechas-servicios");
        const resumenImportesServicios = document.getElementById("resumen-importes-servicios");
        const diagnostico = leerDiagnostico();

        function leerDiagnostico() {
            try {
                return JSON.parse(sessionStorage.getItem(claveDiagnostico) || "null");
            } catch {
                return null;
            }
        }

        const catalogoServicios = {
            resguardo: { nombre: "Resguardo preventivo", precioOriginal: 35000, precioPromocional: 31500 },
            seguridad: { nombre: "Seguridad y antivirus", precioOriginal: 45000, precioPromocional: 40500 },
            organizacion: { nombre: "Organización y acceso", precioOriginal: 40000, precioPromocional: 36000 },
            diagnostico: { nombre: "Diagnóstico y asesoramiento", precioOriginal: 30000, precioPromocional: 27000 },
            migracion: { nombre: "Migración y transferencia de datos", precioOriginal: 25000, precioPromocional: 22500 },
            recuperacion: { nombre: "Recuperación por software", precioOriginal: 50000, precioPromocional: 45000 },
            capacitacion: { nombre: "Capacitación y guía de uso", precioOriginal: 20000, precioPromocional: 18000 },
            mantenimiento: { nombre: "Mantenimiento periódico", precioOriginal: 30000, precioPromocional: 27000 },
            derivacion: { nombre: "Derivación y coordinación con especialistas", precioOriginal: 15000, precioPromocional: 13500 },
            nube: { nombre: "Asesoramiento en Nube S.G.D.", precioOriginal: 12000, precioPromocional: 10800 }
        };
        const serviciosSeleccionados = Array.isArray(diagnostico?.serviciosSeleccionados)
            ? diagnostico.serviciosSeleccionados
                .map((servicio) => {
                    const catalogo = catalogoServicios[servicio?.id];
                    return catalogo ? {
                        id: servicio.id,
                        ...catalogo,
                        cantidad: Number.isSafeInteger(servicio.cantidad) && servicio.cantidad > 0 && servicio.cantidad <= 999 ? servicio.cantidad : 1,
                        promocion: servicio.promocion === true,
                        promocionInicio: servicio.promocionInicio || null
                    } : null;
                })
                .filter((servicio) => servicio !== null)
            : [];
        const valoresServicio = {
            "Virus o malware": { nombre: "Seguridad y antivirus", precio: 45000 },
            "Organización de archivos": { nombre: "Organización y acceso", precio: 40000 },
            "Falta de respaldo": { nombre: "Resguardo preventivo", precio: 35000 },
            "Archivos eliminados": { nombre: "Diagnóstico y asesoramiento", precio: 30000 },
            "Problemas de acceso a archivos": { nombre: "Diagnóstico y asesoramiento", precio: 30000 },
            "Otro problema": { nombre: "Diagnóstico y asesoramiento", precio: 30000 }
        };
        const estimacion = valoresServicio[diagnostico?.problema] || { nombre: "Diagnóstico y asesoramiento", precio: 30000 };
        const inicioPromocionSeleccion = Date.parse(serviciosSeleccionados[0]?.promocionInicio || "");
        let promocionActiva = diagnostico?.promocion === true
            && serviciosSeleccionados.length > 0
            && serviciosSeleccionados.every((servicio) => servicio.promocion)
            && Number.isFinite(inicioPromocionSeleccion)
            && Date.now() >= inicioPromocionSeleccion
            && Date.now() - inicioPromocionSeleccion <= ventanaPromocional;
        const promocionVencio = diagnostico?.promocionSolicitada === true && !promocionActiva;
        const precioPromocional = Math.round(estimacion.precio * .9);
        const descuento = estimacion.precio - precioPromocional;
        const formatoPrecio = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

        document.getElementById("servicio-resumen").textContent = serviciosSeleccionados.length
            ? serviciosSeleccionados.map((servicio) => `${servicio.nombre} × ${servicio.cantidad}`).join(", ")
            : estimacion.nombre;
        document.getElementById("problema-resumen").textContent = diagnostico?.problema || "Sin diagnóstico vinculado";
        const precioOriginalTotal = serviciosSeleccionados.length
            ? serviciosSeleccionados.reduce((total, servicio) => total + servicio.precioOriginal * servicio.cantidad, 0)
            : estimacion.precio;
        const precioPromoTotal = serviciosSeleccionados.length
            ? serviciosSeleccionados.reduce((total, servicio) => total + servicio.precioPromocional * servicio.cantidad, 0)
            : precioPromocional;
        document.getElementById("precio-original").textContent = `Desde ${formatoPrecio.format(precioOriginalTotal)}`;
        document.getElementById("descuento-resumen").textContent = promocionActiva
            ? `Hasta -${formatoPrecio.format(precioOriginalTotal - precioPromoTotal)}`
            : "No aplica";
        document.getElementById("precio-actual").textContent = `Desde ${formatoPrecio.format(promocionActiva ? precioPromoTotal : precioOriginalTotal)}`;
        document.getElementById("aviso-diagnostico").hidden = Boolean(diagnostico);

        if (serviciosSeleccionados.length) {
            fechaUnica.hidden = true;
            diasServicio.disabled = true;
            fechasMultiples.hidden = false;
            notaPromocion.textContent = "Importes aproximados por servicio. La promoción se aplica al solicitar dentro de su vigencia de 7 días y se conserva para las fechas acordadas. El presupuesto final se confirma tras revisar el diagnóstico.";
        } else if (promocionActiva) {
            notaPromocion.textContent = "Promoción del 10% aplicada. Se conserva hasta la fecha seleccionada; si el servicio no se realiza ese día, vence y vuelve al precio original.";
        } else if (promocionVencio) {
            notaPromocion.textContent = "La promoción del 10% ya venció. Se muestra el precio original aproximado.";
        } else {
            notaPromocion.textContent = "El precio final depende de la complejidad y se confirma después de revisar el diagnóstico.";
        }

        if (diagnostico?.nombre) document.getElementById("titular").value = diagnostico.nombre;
        if (diagnostico?.correo) document.getElementById("correo-contacto").value = diagnostico.correo;

        function actualizarFecha() {
            const cantidadDias = Number(diasServicio.value);
            if (!Number.isFinite(cantidadDias) || cantidadDias < 1 || cantidadDias > 90) return;
            const fecha = new Date();
            fecha.setDate(fecha.getDate() + cantidadDias);
            document.getElementById("fecha-estimada").textContent = fecha.toLocaleDateString("es-AR", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
            });
        }

        function fechaRelativa(dias) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() + dias);
            return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
        }

        function diasHastaFecha(valorFecha) {
            const [anio, mes, dia] = valorFecha.split("-").map(Number);
            const fechaObjetivo = Date.UTC(anio, mes - 1, dia);
            const ahora = new Date();
            const hoy = Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
            return Math.round((fechaObjetivo - hoy) / 86400000);
        }

        function obtenerServiciosConFechas() {
            return serviciosSeleccionados.map((servicio) => {
                const fecha = listaFechasServicios.querySelector(`[data-fecha-servicio="${servicio.id}"]`)?.value || "";
                const dias = fecha ? diasHastaFecha(fecha) : NaN;
                const descuentoAplicable = promocionActiva;
                const precio = descuentoAplicable ? servicio.precioPromocional : servicio.precioOriginal;
                return {
                    ...servicio,
                    fecha,
                    dias,
                    precio,
                    descuento: servicio.precioOriginal - precio,
                    promocion: descuentoAplicable
                };
            });
        }

        function actualizarImportesServicios() {
            const programacion = obtenerServiciosConFechas();
            const total = programacion.reduce((suma, servicio) => suma + servicio.precio * servicio.cantidad, 0);
            const totalOriginal = programacion.reduce((suma, servicio) => suma + servicio.precioOriginal * servicio.cantidad, 0);
            const descuentos = programacion.reduce((suma, servicio) => suma + servicio.descuento * servicio.cantidad, 0);
            const lineas = [];
            const porFecha = new Map();

            programacion.forEach((servicio) => {
                const importe = listaFechasServicios.querySelector(`[data-importe-servicio="${servicio.id}"]`);
                importe.textContent = servicio.fecha
                    ? `Estimación para ${servicio.cantidad} unidad${servicio.cantidad === 1 ? "" : "es"} en esa fecha: ${formatoPrecio.format(servicio.precio * servicio.cantidad)}${servicio.promocion ? " (promoción)" : " (precio base)"}`
                    : "Seleccioná una fecha para calcular el importe.";
                if (servicio.fecha) {
                    const fechaLegible = new Date(`${servicio.fecha}T00:00:00`).toLocaleDateString("es-AR");
                    porFecha.set(fechaLegible, (porFecha.get(fechaLegible) || 0) + servicio.precio * servicio.cantidad);
                }
            });

            porFecha.forEach((importe, fecha) => lineas.push(`${fecha}: ${formatoPrecio.format(importe)}`));
            lineas.push(`Total estimado: ${formatoPrecio.format(total)}`);
            resumenImportesServicios.textContent = lineas.join("\n");
            document.getElementById("precio-original").textContent = `Desde ${formatoPrecio.format(totalOriginal)}`;
            document.getElementById("descuento-resumen").textContent = descuentos
                ? `-${formatoPrecio.format(descuentos)}`
                : "No aplica";
            document.getElementById("precio-actual").textContent = `Desde ${formatoPrecio.format(total)}`;
        }

        function inicializarFechasServicios() {
            if (!serviciosSeleccionados.length) return;
            const minimo = fechaRelativa(1);
            const maximo = fechaRelativa(90);
            listaFechasServicios.replaceChildren();
            serviciosSeleccionados.forEach((servicio) => {
                const item = document.createElement("div");
                const label = document.createElement("label");
                const nombre = document.createElement("span");
                const ayuda = document.createElement("small");
                const input = document.createElement("input");
                const importe = document.createElement("p");
                item.className = "fecha-servicio-item";
                nombre.textContent = `${servicio.nombre} × ${servicio.cantidad}`;
                ayuda.textContent = `Precio publicado por unidad: ${formatoPrecio.format(servicio.precioPromocional)}; base: ${formatoPrecio.format(servicio.precioOriginal)}.`;
                label.htmlFor = `fecha-${servicio.id}`;
                label.append(nombre, ayuda);
                input.type = "date";
                input.id = `fecha-${servicio.id}`;
                input.min = minimo;
                input.max = maximo;
                input.value = minimo;
                input.required = true;
                input.dataset.fechaServicio = servicio.id;
                input.addEventListener("change", actualizarImportesServicios);
                importe.className = "importe-servicio";
                importe.dataset.importeServicio = servicio.id;
                item.append(label, input, importe);
                listaFechasServicios.append(item);
            });
            actualizarImportesServicios();
        }

        function actualizarMedioPago() {
            const modalidad = formulario.elements.modalidad.value;
            const presencial = modalidad === "presencial";
            medioDigital.hidden = presencial;
            medioDigital.disabled = presencial;
            medioPresencial.hidden = !presencial;
            medioPresencial.disabled = !presencial;
            cuotas.disabled = presencial;
            if (presencial) cuotas.value = "1";

            if (presencial) {
                detallePago.textContent = "Pago presencial en efectivo o tarjeta el día del servicio. Esta opción no abre otra página.";
            } else if (medioDigital.value === "Transferencia bancaria") {
                detallePago.textContent = "Los datos bancarios oficiales se comparten al confirmar el presupuesto. Verificá el destinatario antes de transferir.";
            } else if (medioDigital.value === "Billetera digital") {
                detallePago.textContent = "El medio digital y sus datos de pago se confirman junto con el presupuesto. No se realiza un cobro desde esta página.";
            } else {
                detallePago.textContent = "El pago con tarjeta se coordina mediante un canal seguro después de aprobar el presupuesto. No ingreses datos de tarjeta aquí.";
            }
        }

        diasServicio.addEventListener("input", actualizarFecha);
        formulario.querySelectorAll('input[name="modalidad"]').forEach((opcion) => opcion.addEventListener("change", actualizarMedioPago));
        medioDigital.addEventListener("change", actualizarMedioPago);
        actualizarFecha();
        inicializarFechasServicios();
        actualizarMedioPago();

        formulario.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                const perfil = (await llamarApi("me")).perfil;
                const fechaInicio = Date.parse(perfil.promocionInicio || "");
                promocionActiva = diagnostico?.promocionSolicitada === true
                    && Number.isFinite(fechaInicio)
                    && Date.now() >= fechaInicio
                    && Date.now() - fechaInicio <= ventanaPromocional;
            } catch (error) {
                promocionActiva = false;
                if (error.message !== "Iniciá sesión para continuar.") {
                    document.getElementById("estado-formulario").textContent = "No se pudo validar la promoción; continuá con el precio base o volvé a intentar.";
                }
            }
            const modalidad = formulario.elements.modalidad.value;
            const medio = modalidad === "digital" ? medioDigital.value : medioPresencial.value;
            let programacion;
            if (serviciosSeleccionados.length) {
                programacion = obtenerServiciosConFechas();
                if (programacion.some((servicio) => !servicio.fecha || servicio.dias < 1 || servicio.dias > 90)) {
                    document.getElementById("estado-formulario").textContent = "Elegí una fecha válida entre mañana y los próximos 90 días para cada servicio.";
                    return;
                }
            } else {
                const cantidadDias = Number(diasServicio.value);
                if (!Number.isFinite(cantidadDias) || cantidadDias < 1 || cantidadDias > 90) {
                    document.getElementById("estado-formulario").textContent = "Elegí una cantidad de días entre 1 y 90.";
                    return;
                }
                const fecha = new Date();
                fecha.setDate(fecha.getDate() + cantidadDias);
                programacion = [{
                    id: "servicio",
                    nombre: estimacion.nombre,
                    precioOriginal: estimacion.precio,
                    precio: promocionActiva ? precioPromocional : estimacion.precio,
                    descuento: promocionActiva ? descuento : 0,
                    promocion: promocionActiva,
                    cantidad: 1,
                    dias: cantidadDias,
                    fecha: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`
                }];
            }
            const precioOriginalSolicitud = programacion.reduce((suma, servicio) => suma + servicio.precioOriginal * servicio.cantidad, 0);
            const precioSolicitud = programacion.reduce((suma, servicio) => suma + servicio.precio * servicio.cantidad, 0);
            const descuentoSolicitud = programacion.reduce((suma, servicio) => suma + servicio.descuento * servicio.cantidad, 0);
            const fechaPrincipal = new Date(`${programacion[0].fecha}T12:00:00Z`);
            const consentimientoJuridico = {
                version: "2026-10-15",
                fecha: new Date().toISOString(),
                contenidoSensible: formulario.elements.consentimientoSensible.checked,
                avisoAutoridades: formulario.elements.avisoAutoridades.checked,
                condiciones: formulario.elements.aceptacionCondiciones.checked
            };
            localStorage.setItem("sgd-consentimiento-juridico", JSON.stringify(consentimientoJuridico));
            const solicitud = {
                ...Object.fromEntries(new FormData(formulario).entries()),
                servicio: programacion.map((servicio) => servicio.nombre).join(", "),
                problema: diagnostico?.problema || "No informado",
                dispositivo: diagnostico?.dispositivo || "No informado",
                precioOriginal: precioOriginalSolicitud,
                precioEstimado: precioSolicitud,
                promocion: programacion.some((servicio) => servicio.promocion),
                servicios: programacion.map((servicio) => ({
                    servicio: servicio.nombre,
                    fecha: servicio.fecha,
                    fechaServicio: new Date(`${servicio.fecha}T12:00:00Z`).toISOString(),
                    precioOriginal: servicio.precioOriginal,
                    precioEstimado: servicio.precio,
                    cantidad: servicio.cantidad,
                    promocion: servicio.promocion
                })),
                dias: programacion[0].dias,
                fechaServicio: fechaPrincipal.toISOString()
            };
            let resultadoPersistencia = "La solicitud no se guardó en una cuenta; el resumen quedó listo para enviar por correo.";
            try {
                const perfil = (await llamarApi("me")).perfil;
                if (perfil.correo.toLowerCase() === solicitud.correo.trim().toLowerCase()) {
                    await llamarApi("request-create", {
                        servicios: solicitud.servicios.map(({ fecha, ...servicio }) => servicio),
                        problema: solicitud.problema,
                        dispositivo: solicitud.dispositivo,
                        modalidad,
                        medioPago: medio,
                        cuotas: modalidad === "digital" ? Number(cuotas.value) : 1,
                        consentimientoSensible: consentimientoJuridico.contenidoSensible,
                        avisoAutoridades: consentimientoJuridico.avisoAutoridades,
                        aceptacionCondiciones: consentimientoJuridico.condiciones
                    });
                    resultadoPersistencia = "La solicitud quedó guardada solo en este navegador. Abrí el correo para revisar y enviar el resumen al equipo.";
                } else {
                    resultadoPersistencia = "El correo de la solicitud no coincide con la cuenta activa; el resumen quedó listo, pero no se guardó en su historial.";
                }
            } catch (error) {
                if (error.message !== "Iniciá sesión para continuar.") {
                    resultadoPersistencia = "No se pudo guardar la solicitud localmente; el resumen quedó listo para enviar por correo.";
                }
            }
            const numeroCuotas = modalidad === "digital" ? Number(cuotas.value) : 1;
            const textoCorreo = [
                "Solicitud de servicio S.G.D.",
                `Nombre: ${solicitud.titular}`,
                `Correo: ${solicitud.correo}`,
                ...(serviciosSeleccionados.length ? ["Servicios, fechas e importes:"] : [`Servicio: ${solicitud.servicio}`]),
                ...(serviciosSeleccionados.length
                    ? solicitud.servicios.map((servicio) => {
                        const fechaLegible = new Date(`${servicio.fecha}T00:00:00`).toLocaleDateString("es-AR");
                        return `- ${servicio.servicio} × ${servicio.cantidad}: ${fechaLegible} — ${formatoPrecio.format(servicio.precioEstimado * servicio.cantidad)}${servicio.promocion ? " (promoción)" : ""}`;
                    })
                    : [`Fecha solicitada: ${fechaPrincipal.toLocaleDateString("es-AR")}`]),
                `Problema: ${solicitud.problema}`,
                `Dispositivo: ${solicitud.dispositivo}`,
                `Medio: ${modalidad} - ${medio}`,
                `Forma de pago: ${numeroCuotas === 1 ? "Un solo pago" : `${numeroCuotas} cuotas`}`,
                `Precio original aproximado total: ${formatoPrecio.format(precioOriginalSolicitud)}`,
                ...(descuentoSolicitud ? [`Descuento promocional (10%): -${formatoPrecio.format(descuentoSolicitud)}`] : []),
                `Estimación total: ${formatoPrecio.format(precioSolicitud)}`,
                "Consentimientos: revisión limitada de contenido, aviso legal de autoridades y condiciones aceptados.",
                ...(programacion.some((servicio) => servicio.promocion) ? ["La promoción se aplica al solicitar dentro de los 7 días de vigencia y se conserva para las fechas acordadas."] : []),
                "El precio es aproximado y requiere confirmación de S.G.D."
            ].join("\n");
            const asunto = `Solicitud de servicio - ${solicitud.titular}`;
            document.getElementById("enlace-correo").href = `mailto:contactossgd@gmail.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(textoCorreo)}`;
            document.getElementById("texto-confirmacion").textContent = `${resultadoPersistencia} La solicitud y el pago todavía requieren confirmación del equipo.`;
            document.getElementById("panel-solicitud").hidden = true;
            document.getElementById("confirmacion").hidden = false;
            document.getElementById("confirmacion").scrollIntoView({ behavior: "smooth", block: "start" });
        });

        const botonTema = document.getElementById("boton-tema");
        const iconoTema = document.getElementById("icono-tema");
        function aplicarTema(tema) {
            const oscuro = tema === "oscuro";
            document.body.classList.toggle("tema-oscuro", oscuro);
            localStorage.setItem("tema-sgd", tema);
            iconoTema.className = oscuro ? "fa-solid fa-sun" : "fa-solid fa-moon";
            botonTema.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
        }
        aplicarTema(localStorage.getItem("tema-sgd") || "claro");
        botonTema.addEventListener("click", () => {
            aplicarTema(document.body.classList.contains("tema-oscuro") ? "claro" : "oscuro");
        });
    })();
}

if (document.documentElement.classList.contains("page-legal")) {
    const botonTema = document.getElementById("boton-tema");
    const iconoTema = document.getElementById("icono-tema");

    function aplicarTemaLegal(tema) {
        const oscuro = tema === "oscuro";
        document.body.classList.toggle("tema-oscuro", oscuro);
        iconoTema.textContent = oscuro ? "☀" : "☾";
        botonTema.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
        botonTema.setAttribute("aria-pressed", String(oscuro));
        try {
            localStorage.setItem("tema-sgd", tema);
        } catch {}
    }

    aplicarTemaLegal(document.body.classList.contains("tema-oscuro") ? "oscuro" : "claro");
    botonTema.addEventListener("click", () => {
        aplicarTemaLegal(document.body.classList.contains("tema-oscuro") ? "claro" : "oscuro");
    });
}

if (document.documentElement.classList.contains("page-configuracion")) {
    (async () => {
        const claveDispositivo = "sgd-dispositivo-id";
        const listaDispositivos = document.getElementById("lista-dispositivos");
        const listaServicios = document.getElementById("lista-servicios");
        const estadoServicios = document.getElementById("estado-servicios");
        const estadoPassword = document.getElementById("estado-password");
        const filtrosServicios = document.querySelectorAll("[data-filtro]");
        const botonCerrarSesion = document.getElementById("cerrar-sesion-dispositivo");

        let perfil;
        try {
            perfil = (await llamarApi("me")).perfil;
        } catch {
            window.location.replace("cuenta.html");
            return;
        }

        const preferenciaAnimaciones = document.getElementById("preferencia-animaciones");
        preferenciaAnimaciones.checked = localStorage.getItem("sgd-animaciones") !== "desactivadas";
        preferenciaAnimaciones.addEventListener("change", () => {
            const activadas = preferenciaAnimaciones.checked;
            localStorage.setItem("sgd-animaciones", activadas ? "activadas" : "desactivadas");
            document.documentElement.classList.toggle("animaciones-deshabilitadas", !activadas);
            if (activadas) document.documentElement.classList.add("animaciones-listas");
            document.querySelectorAll(".revelar").forEach((elemento) => elemento.classList.add("visible"));
        });

        let idDispositivo = localStorage.getItem(claveDispositivo);
        if (!idDispositivo) {
            idDispositivo = crypto.randomUUID ? crypto.randomUUID() : `dispositivo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(claveDispositivo, idDispositivo);
        }

        const plataforma = navigator.userAgentData?.platform || navigator.platform || "Este dispositivo";
        let nombreNavegador = "Navegador";
        if (/Edg\//.test(navigator.userAgent)) nombreNavegador = "Microsoft Edge";
        else if (/Firefox\//.test(navigator.userAgent)) nombreNavegador = "Firefox";
        else if (/Chrome\//.test(navigator.userAgent)) nombreNavegador = "Chrome";
        else if (/Safari\//.test(navigator.userAgent)) nombreNavegador = "Safari";

        try {
            perfil = (await llamarApi("device-register", {
                identificador: idDispositivo,
                nombre: `${nombreNavegador} · ${plataforma}`
            })).perfil;
        } catch (error) {
            listaDispositivos.textContent = error.message || "No se pudieron cargar los dispositivos.";
        }

        function crearTexto(tag, className, text) {
            const elemento = document.createElement(tag);
            if (className) elemento.className = className;
            elemento.textContent = text;
            return elemento;
        }

        function renderizarDispositivos() {
            listaDispositivos.replaceChildren();
            perfil.dispositivos.forEach((dispositivo) => {
                const fila = document.createElement("article");
                fila.className = "config-fila";
                const datos = document.createElement("div");
                datos.append(
                    crearTexto("strong", "", dispositivo.nombre),
                    crearTexto("p", "", dispositivo.id === idDispositivo ? "Este dispositivo · sesión actual" : `Registrado el ${new Date(dispositivo.fechaAlta).toLocaleDateString("es-AR")}`),
                    crearTexto("small", "", `Última actividad: ${new Date(dispositivo.ultimaActividad).toLocaleString("es-AR")}`)
                );
                fila.append(datos);
                if (dispositivo.id !== idDispositivo) {
                    const quitar = crearTexto("button", "config-boton-secundario", "Quitar dispositivo del perfil");
                    quitar.type = "button";
                    quitar.addEventListener("click", async () => {
                        try {
                            perfil = (await llamarApi("device-remove", { identificador: dispositivo.id })).perfil;
                            renderizarDispositivos();
                        } catch (error) {
                            listaDispositivos.textContent = error.message || "No se pudo quitar el dispositivo.";
                        }
                    });
                    fila.append(quitar);
                }
                listaDispositivos.append(fila);
            });
        }

        function renderizarServicios(filtro = "historial") {
            listaServicios.replaceChildren();
            const solicitudes = Array.isArray(perfil.solicitudes) ? perfil.solicitudes : [];
            const filtradas = solicitudes.filter((solicitud) => filtro === "historial" || solicitud.estado === filtro);
            if (!filtradas.length) {
                const mensajes = {
                    historial: "Todavía no hay solicitudes asociadas a este perfil.",
                    en_servicio: "No hay servicios marcados como en servicio.",
                    completado: "No hay servicios marcados como cumplidos."
                };
                listaServicios.append(crearTexto("p", "config-vacio", mensajes[filtro]));
                return;
            }

            filtradas.forEach((solicitud) => {
                const fila = document.createElement("article");
                fila.className = "config-fila config-servicio-fila";
                const datos = document.createElement("div");
                datos.append(
                    crearTexto("strong", "", `${solicitud.servicio}${solicitud.cantidad > 1 ? ` × ${solicitud.cantidad}` : ""}`),
                    crearTexto("p", "", `${solicitud.dispositivo || "Dispositivo no indicado"} · ${new Date(solicitud.fechaCreacion).toLocaleDateString("es-AR")}`)
                );
                const selector = document.createElement("select");
                selector.setAttribute("aria-label", `Estado personal de ${solicitud.servicio}`);
                [["solicitud", "Solicitud preparada"], ["en_servicio", "En servicio"], ["completado", "Cumplido"]].forEach(([valor, etiqueta]) => {
                    const opcion = document.createElement("option");
                    opcion.value = valor;
                    opcion.textContent = etiqueta;
                    opcion.selected = (solicitud.estado || "solicitud") === valor;
                    selector.append(opcion);
                });
                selector.addEventListener("change", async () => {
                    try {
                        perfil = (await llamarApi("request-update", {
                            id: solicitud.id,
                            estado: selector.value
                        })).perfil;
                        estadoServicios.textContent = "";
                        renderizarServicios(document.querySelector('[data-filtro][aria-selected="true"]').dataset.filtro);
                    } catch (error) {
                        selector.value = solicitud.estado;
                        estadoServicios.textContent = error.message || "No se pudo actualizar la solicitud.";
                    }
                });
                fila.append(datos, selector);
                listaServicios.append(fila);
            });
        }

        filtrosServicios.forEach((boton) => {
            boton.addEventListener("click", () => {
                filtrosServicios.forEach((otro) => {
                    const activo = otro === boton;
                    otro.classList.toggle("activa", activo);
                    otro.setAttribute("aria-selected", String(activo));
                });
                renderizarServicios(boton.dataset.filtro);
            });
        });

        document.getElementById("form-cambiar-password").addEventListener("submit", async (event) => {
            event.preventDefault();
            const actual = document.getElementById("password-actual").value;
            const nueva = document.getElementById("password-nueva").value;
            const confirmar = document.getElementById("password-confirmar").value;
            if (nueva !== confirmar) {
                estadoPassword.textContent = "La contraseña nueva y su confirmación no coinciden.";
                return;
            }
            try {
                await llamarApi("password-change", { actual, nueva });
                event.target.reset();
                estadoPassword.textContent = "La contraseña se actualizó.";
            } catch (error) {
                estadoPassword.textContent = error.message || "No se pudo actualizar la contraseña.";
            }
        });

        botonCerrarSesion.addEventListener("click", async () => {
            try {
                await llamarApi("logout", {});
                window.location.href = "index.html";
            } catch (error) {
                estadoPassword.textContent = error.message || "No se pudo cerrar la sesión.";
            }
        });

        const botonTema = document.getElementById("boton-tema");
        const iconoTema = document.getElementById("icono-tema");
        function aplicarTema(tema) {
            const oscuro = tema === "oscuro";
            document.body.classList.toggle("tema-oscuro", oscuro);
            iconoTema.textContent = oscuro ? "☀" : "☾";
            botonTema.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
            botonTema.setAttribute("aria-pressed", String(oscuro));
            localStorage.setItem("tema-sgd", tema);
        }
        aplicarTema(document.body.classList.contains("tema-oscuro") ? "oscuro" : "claro");
        botonTema.addEventListener("click", () => aplicarTema(document.body.classList.contains("tema-oscuro") ? "claro" : "oscuro"));

        renderizarDispositivos();
        renderizarServicios();
    })();
}

const elementosRevelar = document.querySelectorAll(".revelar");

if ("IntersectionObserver" in window
    && !document.documentElement.classList.contains("animaciones-deshabilitadas")
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observadorRevelado = new IntersectionObserver((entradas, observador) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visible");
                observador.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

    elementosRevelar.forEach((elemento) => {
        const hermanos = [...elemento.parentElement.children].filter((hermano) => hermano.classList.contains("revelar"));
        elemento.style.setProperty("--revelar-delay", `${Math.min(hermanos.indexOf(elemento), 3) * 70}ms`);
        observadorRevelado.observe(elemento);
    });
} else {
    elementosRevelar.forEach((elemento) => elemento.classList.add("visible"));
}
