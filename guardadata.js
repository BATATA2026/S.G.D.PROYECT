(() => {
    const acceso = document.getElementById("guardadata-acceso");
    const escritorio = document.getElementById("guarda-os");
    const botonTema = document.getElementById("boton-tema");
    const transicionTema = document.getElementById("transicion-tema");

    function aplicarTema(tema, animar = false) {
        const oscuro = tema === "oscuro";
        document.body.classList.toggle("tema-oscuro", oscuro);
        document.body.setAttribute("data-theme", oscuro ? "dark" : "light");
        document.documentElement.setAttribute("data-theme", oscuro ? "dark" : "light");
        botonTema.textContent = oscuro ? "☀️" : "🌙";
        botonTema.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
        transicionTema.style.background = oscuro ? "#0b0e13" : "#f6f9fd";
        localStorage.setItem("tema-sgd", tema);
        if (animar) {
            transicionTema.classList.add("animando");
            window.setTimeout(() => transicionTema.classList.remove("animando"), 110);
        }
    }

    botonTema.addEventListener("click", () => {
        aplicarTema(document.body.classList.contains("tema-oscuro") ? "claro" : "oscuro", true);
    });

    function iniciarEscritorio() {
        acceso.hidden = true;
        escritorio.hidden = false;
        document.getElementById("os-estado-usuario").textContent = "Demostración pública";
        iniciarHerramientas();
    }

    function formatoTamano(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        const unidades = ["KB", "MB", "GB", "TB"];
        let tamano = bytes / 1024;
        let unidad = 0;
        while (tamano >= 1024 && unidad < unidades.length - 1) {
            tamano /= 1024;
            unidad += 1;
        }
        return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(tamano)} ${unidades[unidad]}`;
    }

    function iniciarHerramientas() {
        const marco = document.getElementById("escritorio");
        if (marco.dataset.iniciado === "true") return;
        marco.dataset.iniciado = "true";

        const paneles = [...marco.querySelectorAll("[data-os-panel]")];
        const botonesVista = [...marco.querySelectorAll("[data-os-vista]")];
        const enlaces = [...marco.querySelectorAll(".os-enlace")];
        const titulo = document.getElementById("os-titulo-vista");
        const subtitulo = document.getElementById("os-subtitulo-vista");
        const estado = document.getElementById("os-estado");
        const busqueda = document.getElementById("os-busqueda-archivos");
        const filasMuestra = [...marco.querySelectorAll('[data-os-panel="archivos"] [data-archivo]')];
        const selectorArchivos = document.getElementById("os-selector-archivos");
        const listaArchivosLocales = document.getElementById("os-lista-local");
        const avisoArchivosVacio = document.getElementById("os-local-vacio");
        const avisoArchivosSinResultados = document.getElementById("os-local-sin-resultados");
        const archivosLocales = [];
        const vistas = {
            inicio: ["GuardaData", "Tu espacio para gestionar información"],
            archivos: ["Archivos", "Explorá documentos y carpetas de ejemplo"],
            almacenamiento: ["Almacenamiento", "Resumen ilustrativo de espacio y servicios"],
            diagnosdata: ["DiagnosData", "Diagnóstico ilustrativo y recomendaciones"],
            copias: ["Copias de seguridad", "Planificación y hábitos recomendados"],
            informes: ["Informes", "Actividad y comprobaciones de ejemplo"],
            configuracion: ["Configuración", "Preferencias de GuardaData"]
        };

        function cambiarVista(vista) {
            const actual = vistas[vista] ? vista : "inicio";
            paneles.forEach((panel) => {
                panel.hidden = panel.dataset.osPanel !== actual;
            });
            botonesVista.forEach((boton) => {
                boton.setAttribute("aria-pressed", String(boton.dataset.osVista === actual));
            });
            enlaces.forEach((enlace) => enlace.classList.toggle("activo", enlace.dataset.osVista === actual));
            titulo.textContent = vistas[actual][0];
            subtitulo.textContent = vistas[actual][1];
            estado.textContent = actual === "diagnosdata"
                ? "Estás viendo un diagnóstico de ejemplo; no se realizó ninguna comprobación real."
                : "";
        }

        botonesVista.forEach((boton) => {
            boton.addEventListener("click", () => cambiarVista(boton.dataset.osVista));
        });

        function aplicarBusqueda() {
            const consulta = busqueda.value.trim().toLocaleLowerCase("es");
            let coincidenciasMuestra = 0;
            let coincidenciasLocales = 0;
            filasMuestra.forEach((fila) => {
                const coincide = fila.textContent.toLocaleLowerCase("es").includes(consulta);
                fila.hidden = !coincide;
                if (coincide) coincidenciasMuestra += 1;
            });
            listaArchivosLocales.querySelectorAll("[data-archivo]").forEach((fila) => {
                const coincide = fila.textContent.toLocaleLowerCase("es").includes(consulta);
                fila.hidden = !coincide;
                if (coincide) coincidenciasLocales += 1;
            });
            document.getElementById("os-archivos-sin-resultados").hidden = coincidenciasMuestra !== 0;
            avisoArchivosVacio.hidden = archivosLocales.length > 0;
            avisoArchivosSinResultados.hidden = archivosLocales.length === 0 || coincidenciasLocales !== 0;
            estado.textContent = consulta
                ? `${coincidenciasMuestra + coincidenciasLocales} coincidencia${coincidenciasMuestra + coincidenciasLocales === 1 ? "" : "s"} en los archivos visibles.`
                : "";
        }

        busqueda.addEventListener("input", () => {
            cambiarVista("archivos");
            aplicarBusqueda();
        });

        selectorArchivos.addEventListener("change", () => {
            const seleccionados = [...selectorArchivos.files];
            seleccionados.forEach((archivo) => {
                const fila = document.createElement("tr");
                const celdaNombre = document.createElement("td");
                const icono = document.createElement("i");
                const celdaTipo = document.createElement("td");
                const celdaTamano = document.createElement("td");
                const celdaAcceso = document.createElement("td");
                const tipo = archivo.type || archivo.name.split(".").pop()?.toUpperCase() || "Archivo";

                fila.className = "os-archivo-local";
                fila.dataset.archivo = "";
                icono.className = "fa-solid fa-file archivo-azul";
                icono.setAttribute("aria-hidden", "true");
                celdaNombre.append(icono, document.createTextNode(` ${archivo.name}`));
                celdaTipo.className = "os-tipo-archivo";
                celdaTipo.textContent = tipo;
                celdaTamano.textContent = formatoTamano(archivo.size);
                celdaAcceso.textContent = "Solo en este dispositivo";
                fila.append(celdaNombre, celdaTipo, celdaTamano, celdaAcceso);
                archivosLocales.push(archivo);
                listaArchivosLocales.append(fila);
            });
            selectorArchivos.value = "";
            aplicarBusqueda();
            if (seleccionados.length) {
                cambiarVista("archivos");
                estado.textContent = `${seleccionados.length} archivo${seleccionados.length === 1 ? "" : "s"} seleccionado${seleccionados.length === 1 ? "" : "s"} localmente. No se cargaron al servidor.`;
            }
        });

    }

    if ("IntersectionObserver" in window && !document.documentElement.classList.contains("animaciones-deshabilitadas")) {
        const observador = new IntersectionObserver((entradas, actual) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("visible");
                    actual.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.12 });
        document.querySelectorAll(".revelar").forEach((elemento) => observador.observe(elemento));
    } else {
        document.querySelectorAll(".revelar").forEach((elemento) => elemento.classList.add("visible"));
    }

    iniciarEscritorio();
})();
