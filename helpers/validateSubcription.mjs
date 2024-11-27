const esFechaValida = (fecha) => {
    return !isNaN(new Date(fecha).getTime());
}

// Función para obtener la fecha actual en horario colombiano
const obtenerFechaActualColombiana = () => {
    return new Date(Date.now()).toISOString().split('.')[0]
}

// Función para comprobar si la fecha actual es menor o igual a la fecha límite
const esFechaActualValida =(fechaLimite) => {
    const ahoraColombiana = obtenerFechaActualColombiana();
    return Date.parse(ahoraColombiana) <= Date.parse(fechaLimite);
}

// Función principal para validar las fechas
export const validarFechas = (fechaLimite) => {
    const limite = new Date(fechaLimite);

    // Validar si la fecha límite es válida
    if (!esFechaValida(fechaLimite)) {
        return "La fecha límite no es válida.";
    }

    return esFechaActualValida(limite);
}