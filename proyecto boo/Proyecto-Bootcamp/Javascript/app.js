document.addEventListener('DOMContentLoaded', async () => {
    const chartCanvas = document.getElementById('windChart');
    const entitySelect = document.getElementById('entitySelect');
    const applyFilterButton = document.getElementById('applyFilter');
    let myChart = null; // Variable para almacenar la instancia del gráfico

    let allData = []; // Para almacenar todos los datos parseados
    let uniqueEntities = new Set(); // Para almacenar las entidades únicas

    // Función para cargar y parsear el CSV
    async function loadCsvData() {
        try {
            // Utiliza la ruta relativa al archivo CSV
            const response = await fetch('Proyecto-Bootcamp/datos/wind-generation.csv');
            const csvText = await response.text();

            const rows = csvText.split('\n').map(row => row.trim()).filter(row => row.length);
            const headers = rows[0].split(',');
            const parsedData = rows.slice(1).map(row => {
                const values = row.split(',');
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header.trim()] = values[index] ? values[index].trim() : ''; // Limpiar espacios en encabezados y valores
                });
                return obj;
            }).filter(row => row.Entity && row.Year && row['Electricity from wind (TWh)']); // Filtra filas incompletas

            allData = parsedData;

            // Llenar el selector de entidades
            allData.forEach(row => uniqueEntities.add(row.Entity));
            Array.from(uniqueEntities).sort().forEach(entity => {
                const option = document.createElement('option');
                option.value = entity;
                option.textContent = entity;
                entitySelect.appendChild(option);
            });

            // Establecer "World" como opción predeterminada si existe
            if (uniqueEntities.has('World')) {
                entitySelect.value = 'World';
            }

            renderChart(entitySelect.value); // Renderizar el gráfico inicial
        } catch (error) {
            console.error('Error al cargar o procesar el archivo CSV:', error);
            alert('No se pudo cargar el archivo de datos. Asegúrate de que "wind-generation.csv" esté en la misma carpeta.');
        }
    }

    // Función para renderizar el gráfico
    function renderChart(selectedEntity) {
        // Filtrar datos por la entidad seleccionada
        const filteredData = allData.filter(row => row.Entity === selectedEntity);

        // Ordenar los datos por año para que el gráfico sea correcto
        filteredData.sort((a, b) => parseInt(a.Year) - parseInt(b.Year));

        const labels = filteredData.map(row => row.Year);
        const windGeneration = filteredData.map(row => parseFloat(row['Electricity from wind (TWh)']));

        if (myChart) {
            myChart.destroy(); // Destruye el gráfico existente antes de crear uno nuevo
        }

        myChart = new Chart(chartCanvas, {
            type: 'line', // Un gráfico de líneas es ideal para series de tiempo
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `Electricidad Eólica (${selectedEntity}) en TWh`,
                        data: windGeneration,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        fill: true, // Rellena el área bajo la línea
                        tension: 0.3 // Suaviza la línea
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Permite que el gráfico se ajuste al contenedor
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Año'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Electricidad de Viento (TWh)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y + ' TWh';
                            }
                        }
                    }
                }
            }
        });
    }

    // Event Listener para el botón de filtro
    applyFilterButton.addEventListener('click', () => {
        const selectedEntity = entitySelect.value;
        renderChart(selectedEntity);
    });

    // Cargar los datos cuando la página esté lista
    loadCsvData();
});