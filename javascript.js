const diasSemana = [
    { key: "lunes", nombre: "Lunes", color: "primary" },
    { key: "martes", nombre: "Martes", color: "success" },
    { key: "miercoles", nombre: "Miércoles", color: "warning" },
    { key: "jueves", nombre: "Jueves", color: "info" },
    { key: "viernes", nombre: "Viernes", color: "danger" },
];

const toggleBtn = document.getElementById("toggle-theme");

let datos = inicializarDatos();

function inicializarDatos() {
    const base = {};
    diasSemana.forEach(d => {
        base[d.key] = [{ entrada: "", salida: "" }];
    });

    const guardado = localStorage.getItem("controlHorario");
    return guardado ? JSON.parse(guardado) : base;
}

// Guardar el localStorage       
function guardarLocalStorage() {
    localStorage.setItem("controlHorario", JSON.stringify(datos));
}

// Confirmar borrado de las horas de la semana
function confirmarBorrado() {
    localStorage.removeItem("controlHorario");
    datos = inicializarDatos();
    render();

    const modal = bootstrap.Modal.getInstance(
        document.getElementById("modalBorrarSemana")
    );
    modal.hide();
}

function mostrarModalBorradoRegistro(dia, index) {
    const modalEl = document.getElementById("modalBorrarRegistroDatos");
    modalEl.dataset.dia = dia; //Se guarda los datos en el modal
    modalEl.dataset.index = index;

    new bootstrap.Modal(modalEl).show();
}

function confirmarBorradoRegistro() {
    const modalEl = document.getElementById("modalBorrarRegistroDatos");
    const dia = modalEl.dataset.dia; //Se recupera los datos del modal
    const index = modalEl.dataset.index;

    datos[dia][index].entrada = "";
    datos[dia][index].salida = "";

    render();
    bootstrap.Modal.getInstance(modalEl).hide();
}

function actualizar(dia, index, campo, valor) {
    // Actualizamos el dato
    datos[dia] = datos[dia].map((p, i) =>
        i === index ? { ...p, [campo]: valor } : p
    );

    const p = datos[dia][index];
    const pAnterior = datos[dia][index - 1];

    if (p.salida && (p.salida < p.entrada)) { // Cuando se introduzca la hora de salida, comprobamos
        p.salida = "";
        mostrarAlertaGlobal("ERROR AL INTRODUCIR LAS HORAS", "Hora de salida menor hora entrada", "warning");
    } else if (p.entrada < pAnterior?.salida) {
        mostrarAlertaGlobal("ERROR AL INTRODUCIR LA HORA DE ENTRADA", "La hora de entrada es menor que la salida anterior", "warning");
        p.entrada = "";
    }

    // Si pasamos las validaciones, mostramos mensaje de éxito
    if (p.salida) {
        mostrarAlertaGlobal("Registro realizado con éxito", "Gracias, por su colaboración", "success");
        limpiarRegistrosIncompletos();
    }

    // Guardamos y renderizamos los cambios
    guardarLocalStorage();
    render();
}

function limpiarRegistrosIncompletos() {
    // Recorremos todos los días de la semana
    diasSemana.forEach(dia => {
        // Limpiamos los registros incompletos (es decir, con entrada pero sin salida)
        datos[dia.key] = datos[dia.key].map(p => {
            if (p.entrada && !p.salida) {
                // Si tiene entrada pero no salida, lo limpiamos
                return { entrada: "", salida: "" };
            }
            return p; // Si está completo, lo dejamos igual
        });
    });
}

function agregarRegistro(dia) {
    // Verificamos si hay registros en ese día
    if (datos[dia] && datos[dia].length > 0) {
        // Obtenemos el último registro de ese día
        const ultimoRegistro = datos[dia][datos[dia].length - 1];

        // Comprobamos si el último registro tiene entrada pero no salida
        if (ultimoRegistro.entrada && !ultimoRegistro.salida) {
            // Si el último registro está incompleto, mostramos una alerta y no añadimos un nuevo registro
            mostrarAlertaGlobal(
                "Registro anterior incompleto",
                "No se puede añadir un nuevo registro sin completar el anterior.",
                "warning"
            );
            return; // No se añade un nuevo registro
        }

        // Comprobamos si el último registro está vacío
        if (!ultimoRegistro.entrada && !ultimoRegistro.salida) {
            // Si el último registro está vacío, no se añade un nuevo registro
            mostrarAlertaGlobal(
                "Registro vacío",
                "No se puede añadir un nuevo registro porque el anterior está vacío.",
                "warning"
            );
            return; // No se añade un nuevo registro
        }
    }

    // Si el último registro está completo (y no está vacío), añadimos un nuevo registro vacío
    datos[dia] = [...datos[dia], { entrada: "", salida: "" }];

    // Guardamos el nuevo estado en el localStorage y renderizamos los cambios
    guardarLocalStorage();
    render();
}

function calcularMinutos(entrada, salida) {
    if (!entrada || !salida) return 0;

    let ini = horaAMinutos(entrada);
    let fin = horaAMinutos(salida);

    return fin - ini;
}

function minutosAFormato(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function totalDiaMinutos(dia) {
    return datos[dia].reduce(
        (acc, p) => acc + calcularMinutos(p.entrada, p.salida),
        0
    );
}

function horaAMinutos(hora) {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}

function totalSemanaMinutos() {
    return diasSemana.reduce(
        (acc, d) => acc + totalDiaMinutos(d.key),
        0
    );
}

function eliminarRegistroIndividual(dia, index) {
    const registro = datos[dia][index];

    // Confirmar borrar si tiene datos
    if (registro.entrada || registro.salida) {
        mostrarModalBorradoRegistro(dia, index);
        return;
    }

    // Evitar dejar el día sin registro
    if (datos[dia].length === 1) {
        mostrarAlertaGlobal(
            "No permitido dejar sin registro un día",
            "Cada día debe tener al menos un registro.",
            "danger"
        );
        return;
    }

    datos[dia] = datos[dia].filter((_, i) => i !== index);
    guardarLocalStorage();
    render();
}

function mostrarAlertaGlobal(titulo, mensaje, tipo) {
    const toastEl = document.getElementById("toastGlobal");
    const toastMsg = document.getElementById("toastMensaje");

    // Texto
    toastMsg.innerHTML = `<strong class="title-text">${titulo}</strong><br>${mensaje}`;

    // Reset clases
    toastEl.className = "toast border-0 shadow";

    if (tipo === "success") toastEl.classList.add("bg-success");
    else if (tipo === "danger") toastEl.classList.add("bg-danger");
    else if (tipo === "warning") toastEl.classList.add("bg-warning");
    else toastEl.classList.add("bg-info-subtle");

    if (tipo === "success") {
        var tiempo = 1500;
    } else {
        tiempo = 3500;
    }
    const toast = new bootstrap.Toast(toastEl, {
        delay: tiempo
    });

    toast.show();
}

// Barra de progreso
function actualizarBarraSemana() {
    const totalMin = totalSemanaMinutos();  // Total de minutos trabajados en la semana
    const max = 40 * 60;  // Límite de 40 horas (en minutos)

    const porcentaje = Math.min((totalMin / max) * 100, 100); // Calcula el porcentaje
    const barra = document.getElementById("barraSemana");

    barra.style.width = porcentaje + "%";
    barra.textContent = `${minutosAFormato(totalMin)} / 40h`;

    // Cambiar color de la barra según el progreso
    if (totalMin <= 20 * 60) {
        barra.classList.remove("bg-warning", "bg-info", "bg-success", "bg-danger", "bg-orange");
        barra.classList.add("bg-danger");
    } else if (totalMin > 20 * 60 && totalMin <= 30 * 60) {
        barra.classList.remove("bg-danger", "bg-info", "bg-success", "bg-warning", "bg-orange");
        barra.classList.add("bg-orange");
    } else if (totalMin > 30 * 60 && totalMin < 40 * 60) {
        barra.classList.remove("bg-danger", "bg-info", "bg-success", "bg-warning", "bg-orange");
        barra.classList.add("bg-warning");
    } else {
        barra.classList.remove("bg-danger", "bg-warning", "bg-info", "bg-success", "bg-orange");
        barra.classList.add("bg-success");
    }
}

// Cambios de color en el body
toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        toggleBtn.textContent = "☀️";
    } else {
        toggleBtn.textContent = "🌙";
    }
});

// Renderizado
function render() {
    const app = document.getElementById("app");
    app.innerHTML = "";

    diasSemana.forEach(dia => {
        const card = document.createElement("div");
        card.className = "card shadow mb-4";
        card.style.width = "280px";
        card.style.borderRadius = "15px";

        card.innerHTML = `
                <div class="card-header bg-${dia.color} text-white d-flex justify-content-between align-items-center">
                <span class="fs-4">${dia.nombre}</span>
                <span class="text-dark fw-bold fs-5">${minutosAFormato(totalDiaMinutos(dia.key))}</span>
                </div>
                <div class="card-body"></div>
                 `;

        const body = card.querySelector(".card-body");

        datos[dia.key].forEach((p, i) => {
            const min = calcularMinutos(p.entrada, p.salida);

            const bloque = document.createElement("div");
            bloque.className = `border rounded p-2 mb-3 border-${dia.color}`;
            const deshabilitarSalida = !p.entrada;

            bloque.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <strong>Registro ${i + 1}</strong>
                        <button class="btn btn-sm btn-outline-danger">🗑️</button>
                    </div>
                    <label>Entrada</label>
                    <input type="time" class="form-control mb-2" value="${p.entrada}">
                    <label>Salida</label>
                    <input type="time" class="form-control mb-2" value="${p.salida}" ${deshabilitarSalida ? "disabled" : ""}>
                    <div class="d-flex justify-content-between mt-2">
                        <strong>Duración</strong>
                        <span>${min ? minutosAFormato(min) : ""}</span>
                    </div>
                     `;

            const inputs = bloque.querySelectorAll("input");
            inputs[0].onchange = e => actualizar(dia.key, i, "entrada", e.target.value);
            inputs[1].onchange = e => actualizar(dia.key, i, "salida", e.target.value);

            const btnEliminar = bloque.querySelector("button");
            btnEliminar.onclick = () => eliminarRegistroIndividual(dia.key, i);

            body.appendChild(bloque);
        });

        // Botón de añadir registro
        const btnAgregar = document.createElement("button");
        btnAgregar.className = "btn btn-outline-primary w-100 mt-2";
        btnAgregar.textContent = "➕ Añadir nuevo registro";
        btnAgregar.onclick = () => agregarRegistro(dia.key);

        body.appendChild(btnAgregar);
        app.appendChild(card);
    });

    // Actualizar total semana
    document.getElementById("totalSemana").innerHTML =
        `<span class="fs-4 ms-5 me-5">Registro total de horas de la semana:</span> <strong>${minutosAFormato(totalSemanaMinutos())}</strong>`;

    actualizarBarraSemana();
}

render();