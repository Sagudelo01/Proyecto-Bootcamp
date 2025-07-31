document.addEventListener('DOMContentLoaded', async () => {
    const chartCanvas = document.getElementById('capacityChart');
    const entitySelect = document.getElementById('lineEntitySelect'); // ID específico para este gráfico
    const applyFilterButton = document.getElementById('applyLineFilter'); // ID específico

    // Checkboxes para activar/desactivar líneas
    const toggleWindCheckbox = document.getElementById('lineToggleWind');
    const toggleSolarCheckbox = document.getElementById('lineToggleSolar');
    const toggleGeothermalCheckbox = document.getElementById('lineToggleGeothermal');

    let myLineChart = null;

    // Almacenamiento de todos los datos parseados
    let allCapacityData = {
        'wind': [],
        'solar': [],
        'geothermal': []
    };
    let allEntities = new Set(); // Las entidades pueden ser diferentes de los otros gráficos

    // Configuración para cada tipo de energía
    const capacityConfig = {
        'wind': {
            fileName: '../Dashboard/data/cumulative-installed-wind-energy-capacity-gigawatts.csv',
            dataColumn: 'Wind Capacity', // Columna relevante en el CSV
            label: 'Eólica',
            color: 'rgba(255, 99, 132, 1)', // Rojo
            borderColor: 'rgba(255, 99, 132, 1)',
            datasetIndex: 0
        },
        'solar': {
            fileName: '../Dashboard/data/installed-solar-PV-capacity.csv',
            dataColumn: 'Solar Capacity', // Columna relevante en el CSV
            label: 'Solar',
            color: 'rgba(54, 162, 235, 1)', // Azul
            borderColor: 'rgba(54, 162, 235, 1)',
            datasetIndex: 1
        },
        'geothermal': {
            fileName: '../Dashboard/data/installed-geothermal-capacity.csv',
            dataColumn: 'Geothermal Capacity', // Columna relevante en el CSV
            label: 'Geotérmica',
            color: 'rgba(75, 192, 192, 1)', // Verde-azulado
            borderColor: 'rgba(75, 192, 192, 1)',
            datasetIndex: 2
        }
    };

    // Función para cargar y parsear un archivo CSV (similar a las anteriores)
    async function fetchAndParseCsv(fileName) {
        try {
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${fileName}`);
            }
            const csvText = await response.text();

            const rows = csvText.split('\n')
                                 .map(row => row.trim())
                                 .filter(row => row.length > 0);
            if (rows.length === 0) {
                console.warn(`Archivo CSV vacío o sin datos: ${fileName}`);
                return [];
            }

            const headers = rows[0].split(',').map(h => h.trim());
            const parsedData = rows.slice(1).map(row => {
                const values = row.split(',');
                let obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] ? values[index].trim() : '';
                });
                return obj;
            }).filter(row => row.Entity && row.Year);

            parsedData.forEach(row => allEntities.add(row.Entity));

            return parsedData;

        } catch (error) {
            console.error(`Error al cargar o procesar el archivo CSV ${fileName}:`, error);
            alert(`No se pudo cargar el archivo de datos: ${fileName}. Asegúrate de que estén en la carpeta 'data'.`);
            return [];
        }
    }

    // Función para cargar todos los datos CSV de capacidad instalada
    async function loadAllCapacityData() {
        const [windRawData, solarRawData, geothermalRawData] = await Promise.all([
            fetchAndParseCsv(capacityConfig.wind.fileName),
            fetchAndParseCsv(capacityConfig.solar.fileName),
            fetchAndParseCsv(capacityConfig.geothermal.fileName)
        ]);

        allCapacityData.wind = windRawData;
        allCapacityData.solar = solarRawData;
        allCapacityData.geothermal = geothermalRawData;

        // Llenar selector de entidades
        Array.from(allEntities).sort().forEach(entity => {
            const option = document.createElement('option');
            option.value = entity;
            option.textContent = entity;
            entitySelect.appendChild(option);
        });

        // Seleccionar "World" por defecto si está disponible
        if (allEntities.has('World')) {
            entitySelect.value = 'World';
        }

        renderLineChart(entitySelect.value);
    }

    // Función para renderizar el gráfico de líneas
    function renderLineChart(selectedEntity) {
        const allYears = new Set();
        // Recopilar todos los años disponibles para la entidad seleccionada de todos los datasets
        Object.values(allCapacityData).forEach(dataArray => {
            dataArray.filter(row => row.Entity === selectedEntity)
                     .forEach(row => allYears.add(row.Year));
        });

        const labels = Array.from(allYears).sort((a, b) => parseInt(a) - parseInt(b));

        const datasets = [];

        for (const type in capacityConfig) {
            const config = capacityConfig[type];
            const filteredData = allCapacityData[type].filter(row => row.Entity === selectedEntity);

            const values = labels.map(year => {
                const dataPoint = filteredData.find(row => row.Year === year);
                // Usar 'null' para los puntos donde no hay datos, Chart.js los maneja como huecos en la línea
                return dataPoint ? parseFloat(dataPoint[config.dataColumn]) : null;
            });

            datasets.push({
                label: `${config.label} (GW)`,
                data: values,
                borderColor: config.borderColor,
                backgroundColor: config.color,
                fill: false, // No rellenar el área debajo de la línea
                tension: 0.3, // Suaviza la línea
                hidden: !document.getElementById(`lineToggle${type.charAt(0).toUpperCase() + type.slice(1)}`).checked // Estado inicial del checkbox
            });
        }

        // Si no hay datos para la selección, mostrar un mensaje
        const hasData = datasets.some(dataset => dataset.data.some(val => val !== null));
        if (!hasData) {
            if (myLineChart) {
                myLineChart.destroy();
                myLineChart = null;
            }
            const ctx = chartCanvas.getContext('2d');
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#888';
            ctx.fillText('No hay datos de capacidad instalada para esta selección.', chartCanvas.width / 2, chartCanvas.height / 2);
            return;
        }


        if (myLineChart) {
            myLineChart.destroy();
        }

        myLineChart = new Chart(chartCanvas, {
            type: 'line', // Tipo de gráfico de líneas
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                            text: 'Capacidad Instalada (GW)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const label = context.dataset.label;
                                return `${label}: ${value.toFixed(2)} GW`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        onClick: (e, legendItem, legend) => {
                            const energyTypeName = legendItem.text.split(' ')[0].toLowerCase(); // 'eólica', 'solar', 'geotérmica'
                            let checkboxId = '';
                            if (energyTypeName === 'eólica') checkboxId = 'lineToggleWind';
                            else if (energyTypeName === 'solar') checkboxId = 'lineToggleSolar';
                            else if (energyTypeName === 'geotérmica') checkboxId = 'lineToggleGeothermal';

                            const checkbox = document.getElementById(checkboxId);
                            if (checkbox) {
                                checkbox.checked = !checkbox.checked;
                                checkbox.dispatchEvent(new Event('change')); // Dispara el evento change para actualizar el gráfico
                            } else {
                                // Comportamiento por defecto de Chart.js si no hay checkbox asociado
                                const index = legendItem.datasetIndex;
                                const meta = myLineChart.getDatasetMeta(index);
                                meta.hidden = meta.hidden === null ? !myLineChart.data.datasets[index].hidden : null;
                                myLineChart.update();
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: `Capacidad Instalada de Energías Renovables en ${selectedEntity}`
                    }
                }
            }
        });

        // Asegurarse de que el estado inicial de las líneas refleje los checkboxes
        myLineChart.setDatasetVisibility(capacityConfig.wind.datasetIndex, toggleWindCheckbox.checked);
        myLineChart.setDatasetVisibility(capacityConfig.solar.datasetIndex, toggleSolarCheckbox.checked);
        myLineChart.setDatasetVisibility(capacityConfig.geothermal.datasetIndex, toggleGeothermalCheckbox.checked);
        myLineChart.update();
    }

    // Función para manejar el cambio de los checkboxes
    function handleCheckboxChange(energyTypeKey) {
        if (myLineChart) {
            const config = capacityConfig[energyTypeKey];
            const checkbox = document.getElementById(`lineToggle${energyTypeKey.charAt(0).toUpperCase() + energyTypeKey.slice(1)}`);
            if (checkbox) {
                myLineChart.setDatasetVisibility(config.datasetIndex, checkbox.checked);
                myLineChart.update();
            }
        }
    }

    // Event Listeners para los checkboxes
    toggleWindCheckbox.addEventListener('change', () => handleCheckboxChange('wind'));
    toggleSolarCheckbox.addEventListener('change', () => handleCheckboxChange('solar'));
    toggleGeothermalCheckbox.addEventListener('change', () => handleCheckboxChange('geothermal'));

    // Event Listener para el botón de filtro
    applyFilterButton.addEventListener('click', () => {
        const selectedEntity = entitySelect.value;
        renderLineChart(selectedEntity);
    });

    // Cargar los datos cuando la página esté lista
    loadAllCapacityData();
});