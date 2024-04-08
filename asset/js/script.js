document.addEventListener("DOMContentLoaded", async function() {
    const montoInput = document.getElementById("monto");
    const monedaSelect = document.getElementById("cambio");
    const buscarBtn = document.getElementById("buscar");
    const resultadoMsg = document.getElementById("resultado");
    let grafico = null;

    async function fetchMonedasDisponibles() {
        try {
            const response = await fetch("https://mindicador.cl/api");
            if (!response.ok) {
                throw new Error("No se pudo obtener la lista de monedas disponibles.");
            }
            const data = await response.json();

            const monedasFiltered = Object.keys(data).filter(indicador => data[indicador]['unidad_medida'] === 'Pesos');

            const detalleMonedas = monedasFiltered.map(moneda => ({
                codigo: data[moneda]['codigo'],
                nombre: data[moneda]['nombre'],
                valor: data[moneda]['valor']
            }));

            return detalleMonedas;
        } catch (error) {
            throw new Error("Error al obtener la lista de monedas disponibles.");
        }
    }

    async function formatPesoChileno(value) {
        return value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    }

    buscarBtn.disabled = true;

    try {
        const monedasDisponibles = await fetchMonedasDisponibles();
        monedasDisponibles.forEach(moneda => {
            monedaSelect.innerHTML += `<option value="${moneda.codigo}">${moneda.nombre}</option>`;
        });
        buscarBtn.disabled = false;
    } catch (error) {
        console.error("Error al cargar las monedas disponibles:", error.message);
    }

    buscarBtn.addEventListener("click", async function() {
        try {
            const monto = parseFloat(montoInput.value.replace(/\D/g, ''));

            document.getElementById('resultado').innerText = 'Cargando...'

            if (isNaN(monto)) {
                throw new Error("Por favor ingrese un monto válido.");
            }

            const moneda = monedaSelect.value;
            if (!moneda) {
                throw new Error("Por favor seleccione una moneda.");
            }

            resultadoMsg.textContent = "Calculando...";

            const serie = await fetchValorMoneda(moneda);

            document.getElementById('resultado').innerText = ''

            const valorMoneda = serie[serie.length - 1].valor;
            const resultado = monto / valorMoneda;
            resultadoMsg.textContent = `El valor en ${moneda.toUpperCase()} es ${resultado.toFixed(2)}`;

            montoInput.value = await formatPesoChileno(monto);

            if (grafico) {
                grafico.destroy();
            }

            mostrarGrafico(serie);
        } catch (error) {
            resultadoMsg.textContent = `Error: ${error.message}`;
        }
    });

    async function fetchValorMoneda(moneda) {
        try {
            const response = await fetch(`https://mindicador.cl/api/${moneda}`);
            if (!response.ok) {
                throw new Error("No se pudo obtener el valor de la moneda.");
            }
            const data = await response.json();
            return data.serie;
        } catch (error) {
            throw new Error("Error al obtener el valor de la moneda.");
        }
    }

    function mostrarGrafico(serie) {
        const ultimasFechas = serie.splice(0, 10).map(entry => entry.fecha);
        const ultimosValores = serie.splice(0, 10).map(entry => entry.valor);
    
        const graficoCanvas = document.getElementById("grafico");
    
        if (grafico) {
            grafico.destroy();
        }
    
        grafico = new Chart(graficoCanvas, {
            type: 'line',
            data: {
                labels: ultimasFechas,
                datasets: [{
                    label: 'Variación de moneda de cambio en los últomos 10 días',
                    data: ultimosValores,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)'
                }]
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    }]
                }
            }
        });
    }
    
});
