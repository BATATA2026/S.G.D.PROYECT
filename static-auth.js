(() => {
    const claveCuentas = "sgd-demo-cuentas";
    const claveSesion = "sgd-demo-sesion";
    const claveInicioPromocionDemo = "sgd-demo-promocion-inicio";
    const duracionPromocion = 7 * 24 * 60 * 60 * 1000;

    function leer(clave, valorInicial) {
        const guardado = localStorage.getItem(clave);
        return guardado === null ? valorInicial : JSON.parse(guardado);
    }

    function guardar(clave, valor) {
        localStorage.setItem(clave, JSON.stringify(valor));
    }

    function correoNormalizado(valor) {
        return String(valor || "").trim().toLowerCase();
    }

    function obtenerInicioPromocionDemo() {
        const guardado = localStorage.getItem(claveInicioPromocionDemo);
        if (guardado !== null) {
            if (!Number.isFinite(Date.parse(guardado))) {
                throw new Error("No se pudo leer la fecha de inicio de la promoción en este navegador.");
            }
            return guardado;
        }
        const inicio = new Date().toISOString();
        localStorage.setItem(claveInicioPromocionDemo, inicio);
        return inicio;
    }

    function convertirHexadecimal(bytes) {
        return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    async function derivarHash(contrasena, sal) {
        if (!window.crypto?.subtle) {
            throw new Error("El navegador necesita HTTPS o localhost para habilitar el acceso de demostración.");
        }
        const clave = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(contrasena),
            "PBKDF2",
            false,
            ["deriveBits"]
        );
        const bits = await crypto.subtle.deriveBits({
            name: "PBKDF2",
            salt: Uint8Array.from(sal.match(/.{2}/g), (byte) => parseInt(byte, 16)),
            iterations: 120000,
            hash: "SHA-256"
        }, clave, 256);
        return convertirHexadecimal(bits);
    }

    function leerCuentas() {
        const cuentas = leer(claveCuentas, {});
        if (!cuentas || typeof cuentas !== "object" || Array.isArray(cuentas)) {
            throw new Error("Los perfiles de demostración guardados no se pueden leer en este navegador.");
        }
        return cuentas;
    }

    function perfilPublico(cuenta) {
        return {
            id: cuenta.id,
            nombre: cuenta.nombre,
            apellido: cuenta.apellido,
            empresa: cuenta.empresa,
            correo: cuenta.correo,
            condicionesVersion: cuenta.condicionesVersion || null,
            condicionesFecha: cuenta.condicionesFecha || null,
            promocionInicio: cuenta.promocionInicio,
            dispositivos: cuenta.dispositivos || [],
            solicitudes: cuenta.solicitudes || []
        };
    }

    function cuentaActual(iniciarPromocion = true) {
        const correo = correoNormalizado(localStorage.getItem(claveSesion));
        if (!correo) throw new Error("Iniciá sesión para continuar.");
        const cuentas = leerCuentas();
        const cuenta = cuentas[correo];
        if (!cuenta) {
            localStorage.removeItem(claveSesion);
            throw new Error("El perfil de demostración ya no está disponible.");
        }
        if (iniciarPromocion && !cuenta.promocionInicio) {
            cuenta.promocionInicio = new Date().toISOString();
            cuentas[correo] = cuenta;
            guardar(claveCuentas, cuentas);
        }
        return { correo, cuenta, cuentas };
    }

    function sesionActiva() {
        try {
            const correo = correoNormalizado(localStorage.getItem(claveSesion));
            const cuentas = leerCuentas();
            return Boolean(correo && cuentas[correo]);
        } catch {
            return false;
        }
    }

    async function iniciarSesion(correo, contrasena) {
        const cuentas = leerCuentas();
        const cuenta = cuentas[correoNormalizado(correo)];
        if (!cuenta) throw new Error("El correo o la contraseña no son correctos.");
        const hash = await derivarHash(contrasena, cuenta.sal);
        if (hash !== cuenta.hash) throw new Error("El correo o la contraseña no son correctos.");
        localStorage.setItem(claveSesion, cuenta.correo);
        if (!cuenta.promocionInicio) {
            cuenta.promocionInicio = new Date().toISOString();
            guardar(claveCuentas, cuentas);
        }
        return { perfil: perfilPublico(cuenta) };
    }

    async function api(accion, datos = {}) {
        if (accion === "register") {
            const correo = correoNormalizado(datos.correo);
            const cuentas = leerCuentas();
            const contrasena = String(datos.contrasena || "");
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
                || correo.length > 191
                || !String(datos.nombre || "").trim()
                || String(datos.nombre).trim().length > 60
                || !String(datos.apellido || "").trim()
                || String(datos.apellido).trim().length > 60
                || String(datos.empresa || "").trim().length > 100
                || contrasena.length < 12
                || contrasena.length > 1024
                || datos.condicionesAceptadas !== true) {
                throw new Error("Completá los datos, aceptá las condiciones y usá una contraseña de al menos 12 caracteres.");
            }
            if (cuentas[correo]) throw new Error("Ya existe un perfil con ese correo en este navegador.");
            const sal = convertirHexadecimal(crypto.getRandomValues(new Uint8Array(16)));
            const cuenta = {
                id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
                nombre: String(datos.nombre || "").trim(),
                apellido: String(datos.apellido || "").trim(),
                empresa: String(datos.empresa || "").trim(),
                correo,
                sal,
                hash: await derivarHash(contrasena, sal),
                condicionesVersion: "2026-10-15",
                condicionesFecha: new Date().toISOString(),
                promocionInicio: new Date().toISOString(),
                dispositivos: [],
                solicitudes: []
            };
            cuentas[correo] = cuenta;
            guardar(claveCuentas, cuentas);
            localStorage.setItem(claveSesion, correo);
            guardar("sgd-consentimiento-juridico", {
                version: cuenta.condicionesVersion,
                fecha: cuenta.condicionesFecha
            });
            return { perfil: perfilPublico(cuenta) };
        }

        if (accion === "login") {
            return iniciarSesion(datos.correo, String(datos.contrasena || ""));
        }

        if (accion === "logout") {
            localStorage.removeItem(claveSesion);
            document.dispatchEvent(new CustomEvent("sgd:cierre-sesion"));
            return { ok: true };
        }

        if (accion === "password-reset-request" || accion === "password-reset-complete") {
            throw new Error("La recuperación por correo no está disponible en esta versión estática.");
        }

        const { correo, cuenta, cuentas } = cuentaActual();
        if (accion === "me") return { perfil: perfilPublico(cuenta) };

        if (accion === "device-register") {
            const identificador = String(datos.identificador || "");
            const dispositivo = cuenta.dispositivos.find((item) => item.identificador === identificador);
            if (dispositivo) {
                dispositivo.nombre = String(datos.nombre || "");
                dispositivo.ultimaActividad = new Date().toISOString();
            } else {
                cuenta.dispositivos.push({
                    identificador,
                    nombre: String(datos.nombre || ""),
                    fechaAlta: new Date().toISOString(),
                    ultimaActividad: new Date().toISOString()
                });
            }
            cuentas[correo] = cuenta;
            guardar(claveCuentas, cuentas);
            return { perfil: perfilPublico(cuenta) };
        }

        if (accion === "device-remove") {
            cuenta.dispositivos = cuenta.dispositivos.filter((item) => item.identificador !== datos.identificador);
            cuentas[correo] = cuenta;
            guardar(claveCuentas, cuentas);
            return { perfil: perfilPublico(cuenta) };
        }

        if (accion === "request-create") {
            const servicios = Array.isArray(datos.servicios) ? datos.servicios : [];
            servicios.forEach((servicio) => {
                cuenta.solicitudes.unshift({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    servicio: servicio.servicio,
                    cantidad: Number(servicio.cantidad) || 1,
                    problema: String(datos.problema || ""),
                    dispositivo: String(datos.dispositivo || ""),
                    fechaServicio: servicio.fechaServicio || new Date().toISOString(),
                    fechaCreacion: new Date().toISOString(),
                    precioEstimado: (Number(servicio.precioEstimado) || 0) * (Number(servicio.cantidad) || 1),
                    estado: "solicitud",
                    estadoActualizado: null
                });
            });
            cuentas[correo] = cuenta;
            guardar(claveCuentas, cuentas);
            return { perfil: perfilPublico(cuenta) };
        }

        if (accion === "request-update") {
            const solicitud = cuenta.solicitudes.find((item) => item.id === Number(datos.id));
            if (!solicitud) throw new Error("No se encontró esa solicitud.");
            solicitud.estado = datos.estado;
            solicitud.estadoActualizado = new Date().toISOString();
            cuentas[correo] = cuenta;
            guardar(claveCuentas, cuentas);
            return { perfil: perfilPublico(cuenta) };
        }

        if (accion === "password-change") {
            const hashActual = await derivarHash(String(datos.actual || ""), cuenta.sal);
            const nueva = String(datos.nueva || "");
            if (hashActual !== cuenta.hash) throw new Error("La contraseña actual no es correcta.");
            if (nueva.length < 12 || nueva.length > 1024) {
                throw new Error("La contraseña nueva debe tener al menos 12 caracteres.");
            }
            cuenta.sal = convertirHexadecimal(crypto.getRandomValues(new Uint8Array(16)));
            cuenta.hash = await derivarHash(nueva, cuenta.sal);
            cuentas[correo] = cuenta;
            guardar(claveCuentas, cuentas);
            return { ok: true };
        }

        throw new Error("La acción solicitada no está disponible en el modo estático.");
    }

    window.sgdDemoApi = api;
    window.sgdDemoSesionActiva = sesionActiva;
    window.sgdDemoPromocionInicio = obtenerInicioPromocionDemo;
    window.sgdDemoPromocionActiva = (inicio) => {
        const fechaInicio = Date.parse(inicio || obtenerInicioPromocionDemo());
        return Number.isFinite(fechaInicio)
            && Date.now() >= fechaInicio
            && Date.now() - fechaInicio <= duracionPromocion;
    };
})();
