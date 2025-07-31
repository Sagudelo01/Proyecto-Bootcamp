document.addEventListener('DOMContentLoaded', async () => {
    const chartCanvas = document.getElementById('stackedAreaChart'); // ID específico para este gráfico
    const entitySelect = document.getElementById('areaEntitySelect'); // ID específico
    const applyFilterButton = document.getElementById('applyAreaFilter'); // ID específico

    // Checkboxes para activar/desactivar áreas
    const toggleWindCheckbox = document.getElementById('areaToggleWind');
    const toggleSolarCheckbox = document.getElementById('areaToggleSolar');
    const toggleBiofuelCheckbox = document.getElementById('areaToggleBiofuel');
    const toggleHydroCheckbox = document.getElementById('areaToggleHydro');

    let myAreaChart = null;

    // Almacenamiento de todos los datos parseados (son los mismos que para el gráfico de barras, pero se cargarán aquí de forma independiente)
    let allGenerationData = {
        'wind': [],
        'solar': [],
        'biofuel': [],
        'hydro': []
    };
    let allEntities = new Set(); // Las entidades pueden ser diferentes de los otros gráficos

    // Configuración para cada tipo de energía
    const energyConfig = {
        'wind': {
            fileName: '../Dashboard/data/wind-generation.csv',
            dataColumn: 'Electricity from wind (TWh)',
            label: 'Eólica',
            // Colores con opacidad para gráficos de área
            backgroundColor: 'rgba(75, 192, 192, 0.7)', // Verde azulado
            borderColor: 'rgba(75, 192, 192, 1)',
            datasetIndex: 0
        },
        'solar': {
            fileName: '../Dashboard/data/solar-energy-consumption.csv',
            dataColumn: 'Electricity from solar (TWh)',
            label: 'Solar',
            backgroundColor: 'rgba(255, 206, 86, 0.7)', // Amarillo
            borderColor: 'rgba(255, 206, 86, 1)',
            datasetIndex: 1
        },
        'biofuel': {
            fileName: '../Dashboard/data/biofuel-production.csv',
            dataColumn: 'Biofuels Production - TWh - Total',
            label: 'Biocombustibles',
            backgroundColor: 'rgba(153, 102, 255, 0.7)', // Púrpura
            borderColor: 'rgba(153, 102, 255, 1)',
            datasetIndex: 2
        },
        'hydro': {
            fileName: '../Dashboard/data/hydropower-consumption.csv',
            dataColumn: 'Electricity from hydro (TWh)',
            label: 'Hidroeléctrica',
            backgroundColor: 'rgba(54, 162, 235, 0.7)', // Azul
            borderColor: 'rgba(54, 162, 235, 1)',
            datasetIndex: 3
        }
    };

    // Función para cargar y parsear un archivo CSV (reutilizada de otros scripts)
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
            // alert(`No se pudo cargar el archivo de datos: ${fileName}. Asegúrate de que esté en la carpeta 'data'.`); // Evitar múltiples alertas
            return [];
        }
    }

    // Función para cargar todos los datos CSV de generación
    async function loadAllGenerationData() {
        const [windRawData, solarRawData, biofuelRawData, hydroRawData] = await Promise.all([
            fetchAndParseCsv(energyConfig.wind.fileName),
            fetchAndParseCsv(energyConfig.solar.fileName),
            fetchAndParseCsv(energyConfig.biofuel.fileName),
            fetchAndParseCsv(energyConfig.hydro.fileName)
        ]);

        allGenerationData.wind = windRawData;
        allGenerationData.solar = solarRawData;
        allGenerationData.biofuel = biofuelRawData;
        allGenerationData.hydro = hydroRawData;

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

        renderAreaChart(entitySelect.value);
    }

    // Función para renderizar el gráfico de área apilado
    function renderAreaChart(selectedEntity) {
        const allYears = new Set();
        // Recopilar todos los años disponibles para la entidad seleccionada de todos los datasets
        Object.values(allGenerationData).forEach(dataArray => {
            dataArray.filter(row => row.Entity === selectedEntity)
                    .forEach(row => allYears.add(row.Year));
        });

        const labels = Array.from(allYears).sort((a, b) => parseInt(a) - parseInt(b));

        const datasets = [];

        for (const type in energyConfig) {
            const config = energyConfig[type];
            const filteredData = allGenerationData[type].filter(row => row.Entity === selectedEntity);

            const values = labels.map(year => {
                const dataPoint = filteredData.find(row => row.Year === year);
                return dataPoint ? parseFloat(dataPoint[config.dataColumn]) : 0; // Usar 0 para datos faltantes para gráficos apilados
            });

            datasets.push({
                label: `${config.label} (TWh)`,
                data: values,
                backgroundColor: config.backgroundColor,
                borderColor: config.borderColor,
                borderWidth: 1,
                fill: true, // Rellenar el área
                tension: 0.3, // Suaviza la línea
                hidden: !document.getElementById(`areaToggle${type.charAt(0).toUpperCase() + type.slice(1)}`).checked // Estado inicial del checkbox
            });
        }

        // Si no hay datos para la selección, mostrar un mensaje
        const hasData = datasets.some(dataset => dataset.data.some(val => val > 0));
        if (!hasData) {
            if (myAreaChart) {
                myAreaChart.destroy();
                myAreaChart = null;
            }
            const ctx = chartCanvas.getContext('2d');
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#888';
            ctx.fillText('No hay datos de generación renovable para esta selección.', chartCanvas.width / 2, chartCanvas.height / 2);
            return;
        }

        if (myAreaChart) {
            myAreaChart.destroy();
        }

        myAreaChart = new Chart(chartCanvas, {
            type: 'line', // El tipo 'line' se usa para gráficos de área con fill: true
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
                        },
                        stacked: true // Habilitar apilamiento en el eje X (para barras)
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Generación de Electricidad (TWh)'
                        },
                        stacked: true // Habilitar apilamiento en el eje Y
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index', // Mostrar tooltips para todos los datasets en un punto
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const label = context.dataset.label;
                                return `${label}: ${value.toFixed(2)} TWh`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        onClick: (e, legendItem, legend) => {
                            const energyTypeName = legendItem.text.split(' ')[0].toLowerCase(); // 'eólica', 'solar', etc.
                            let checkboxId = '';
                            if (energyTypeName === 'eólica') checkboxId = 'areaToggleWind';
                            else if (energyTypeName === 'solar') checkboxId = 'areaToggleSolar';
                            else if (energyTypeName === 'biocombustibles') checkboxId = 'areaToggleBiofuel';
                            else if (energyTypeName === 'hidroeléctrica') checkboxId = 'areaToggleHydro';

                            const checkbox = document.getElementById(checkboxId);
                            if (checkbox) {
                                checkbox.checked = !checkbox.checked;
                                checkbox.dispatchEvent(new Event('change')); // Dispara el evento change
                            } else {
                                const index = legendItem.datasetIndex;
                                const meta = myAreaChart.getDatasetMeta(index);
                                meta.hidden = meta.hidden === null ? !myAreaChart.data.datasets[index].hidden : null;
                                myAreaChart.update();
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: `Generación de Energías Renovables en ${selectedEntity}`
                    }
                }
            }
        });

        // Asegurarse de que el estado inicial de las áreas refleje los checkboxes
        myAreaChart.setDatasetVisibility(energyConfig.wind.datasetIndex, toggleWindCheckbox.checked);
        myAreaChart.setDatasetVisibility(energyConfig.solar.datasetIndex, toggleSolarCheckbox.checked);
        myAreaChart.setDatasetVisibility(energyConfig.biofuel.datasetIndex, toggleBiofuelCheckbox.checked);
        myAreaChart.setDatasetVisibility(energyConfig.hydro.datasetIndex, toggleHydroCheckbox.checked);
        myAreaChart.update();
    }

    // Función para manejar el cambio de los checkboxes
    function handleCheckboxChange(energyTypeKey) {
        if (myAreaChart) {
            const config = energyConfig[energyTypeKey];
            const checkbox = document.getElementById(`areaToggle${energyTypeKey.charAt(0).toUpperCase() + energyTypeKey.slice(1)}`);
            if (checkbox) {
                myAreaChart.setDatasetVisibility(config.datasetIndex, checkbox.checked);
                myAreaChart.update();
            }
        }
    }

    // Event Listeners para los checkboxes
    toggleWindCheckbox.addEventListener('change', () => handleCheckboxChange('wind'));
    toggleSolarCheckbox.addEventListener('change', () => handleCheckboxChange('solar'));
    toggleBiofuelCheckbox.addEventListener('change', () => handleCheckboxChange('biofuel'));
    toggleHydroCheckbox.addEventListener('change', () => handleCheckboxChange('hydro'));

    // Event Listener para el botón de filtro
    applyFilterButton.addEventListener('click', () => {
        const selectedEntity = entitySelect.value;
        renderAreaChart(selectedEntity);
    });

    // Cargar los datos cuando la página esté lista
    loadAllGenerationData();
});