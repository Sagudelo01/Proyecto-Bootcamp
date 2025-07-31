document.addEventListener('DOMContentLoaded', async () => {
    const chartCanvas = document.getElementById('energyChart');
    const entitySelect = document.getElementById('barEntitySelect'); // CAMBIADO EL ID
    const applyFilterButton = document.getElementById('applyBarFilter'); // CAMBIADO EL ID

    // Referencias a los checkboxes (CAMBIADOS LOS IDs)
    const toggleWindCheckbox = document.getElementById('barToggleWind');
    const toggleSolarCheckbox = document.getElementById('barToggleSolar');
    const toggleBiofuelCheckbox = document.getElementById('barToggleBiofuel');
    const toggleHydroCheckbox = document.getElementById('barToggleHydro');

    let myChart = null;

    let allEnergyData = {
        'wind': [],
        'solar': [],
        'biofuel': [],
        'hydro': []
    };
    let allEntities = new Set(); // Nota: Estas entidades son específicas para este gráfico

    const energyConfig = {
        'wind': {
            fileName: '../Dashboard/data/wind-generation.csv',
            dataColumn: 'Electricity from wind (TWh)',
            label: 'Eólica',
            color: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            datasetIndex: 0
        },
        'solar': {
            fileName: '../Dashboard/data/solar-energy-consumption.csv',
            dataColumn: 'Electricity from solar (TWh)',
            label: 'Solar',
            color: 'rgba(255, 206, 86, 0.7)',
            borderColor: 'rgba(255, 206, 86, 1)',
            datasetIndex: 1
        },
        'biofuel': {
            fileName: '../Dashboard/data/biofuel-production.csv',
            dataColumn: 'Biofuels Production - TWh - Total',
            label: 'Biocombustibles',
            color: 'rgba(153, 102, 255, 0.7)',
            borderColor: 'rgba(153, 102, 255, 1)',
            datasetIndex: 2
        },
        'hydro': {
            fileName: '../Dashboard/data/hydropower-consumption.csv',
            dataColumn: 'Electricity from hydro (TWh)',
            label: 'Hidroeléctrica',
            color: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            datasetIndex: 3
        }
    };

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
            // alert(`No se pudo cargar el archivo de datos: ${fileName}. Asegúrate de que esté en la misma carpeta.`); // Eliminar alert para no molestar si hay muchos errores
            return [];
        }
    }

    async function loadAllCsvData() {
        const [windRawData, solarRawData, biofuelRawData, hydroRawData] = await Promise.all([
            fetchAndParseCsv(energyConfig.wind.fileName),
            fetchAndParseCsv(energyConfig.solar.fileName),
            fetchAndParseCsv(energyConfig.biofuel.fileName),
            fetchAndParseCsv(energyConfig.hydro.fileName)
        ]);

        allEnergyData.wind = windRawData;
        allEnergyData.solar = solarRawData;
        allEnergyData.biofuel = biofuelRawData;
        allEnergyData.hydro = hydroRawData;

        Array.from(allEntities).sort().forEach(entity => {
            const option = document.createElement('option');
            option.value = entity;
            option.textContent = entity;
            entitySelect.appendChild(option);
        });

        if (allEntities.has('World')) {
            entitySelect.value = 'World';
        }

        renderChart(entitySelect.value);
    }

    function renderChart(selectedEntity) {
        const allYears = new Set();
        Object.values(allEnergyData).forEach(dataArray => {
            dataArray.filter(row => row.Entity === selectedEntity)
                    .forEach(row => allYears.add(row.Year));
        });

        const labels = Array.from(allYears).sort((a, b) => parseInt(a) - parseInt(b));

        const datasets = [];

        for (const type in energyConfig) {
            const config = energyConfig[type];
            const filteredData = allEnergyData[type].filter(row => row.Entity === selectedEntity);

            const values = labels.map(year => {
                const dataPoint = filteredData.find(row => row.Year === year);
                return dataPoint ? parseFloat(dataPoint[config.dataColumn]) : null;
            });

            datasets.push({
                label: `${config.label} (TWh)`,
                data: values,
                backgroundColor: config.color,
                borderColor: config.borderColor,
                borderWidth: 1,
                hidden: !document.getElementById(`barToggle${type.charAt(0).toUpperCase() + type.slice(1)}`).checked // CAMBIADO EL ID
            });
        }

        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(chartCanvas, {
            type: 'bar',
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
                            text: 'Electricidad Generada (TWh)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const label = context.dataset.label;
                                return `${label}: ${value} TWh`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        onClick: (e, legendItem, legend) => {
                            const energyTypeName = legendItem.text.split(' ')[0].toLowerCase();
                            let checkboxId = '';
                            if (energyTypeName === 'eólica') checkboxId = 'barToggleWind'; // CAMBIADO EL ID
                            else if (energyTypeName === 'solar') checkboxId = 'barToggleSolar'; // CAMBIADO EL ID
                            else if (energyTypeName === 'biocombustibles') checkboxId = 'barToggleBiofuel'; // CAMBIADO EL ID
                            else if (energyTypeName === 'hidroeléctrica') checkboxId = 'barToggleHydro'; // CAMBIADO EL ID

                            const checkbox = document.getElementById(checkboxId);
                            if (checkbox) {
                                checkbox.checked = !checkbox.checked;
                                checkbox.dispatchEvent(new Event('change'));
                            } else {
                                const index = legendItem.datasetIndex;
                                const meta = myChart.getDatasetMeta(index);
                                meta.hidden = meta.hidden === null ? !myChart.data.datasets[index].hidden : null;
                                myChart.update();
                            }
                        }
                    }
                }
            }
        });

        myChart.setDatasetVisibility(energyConfig.wind.datasetIndex, toggleWindCheckbox.checked);
        myChart.setDatasetVisibility(energyConfig.solar.datasetIndex, toggleSolarCheckbox.checked);
        myChart.setDatasetVisibility(energyConfig.biofuel.datasetIndex, toggleBiofuelCheckbox.checked);
        myChart.setDatasetVisibility(energyConfig.hydro.datasetIndex, toggleHydroCheckbox.checked);
        myChart.update();
    }

    function handleCheckboxChange(energyTypeKey) {
        if (myChart) {
            const config = energyConfig[energyTypeKey];
            const checkbox = document.getElementById(`barToggle${energyTypeKey.charAt(0).toUpperCase() + energyTypeKey.slice(1)}`); // CAMBIADO EL ID
            if (checkbox) {
                myChart.setDatasetVisibility(config.datasetIndex, checkbox.checked);
                myChart.update();
            }
        }
    }

    toggleWindCheckbox.addEventListener('change', () => handleCheckboxChange('wind'));
    toggleSolarCheckbox.addEventListener('change', () => handleCheckboxChange('solar'));
    toggleBiofuelCheckbox.addEventListener('change', () => handleCheckboxChange('biofuel'));
    toggleHydroCheckbox.addEventListener('change', () => handleCheckboxChange('hydro'));

    applyFilterButton.addEventListener('click', () => {
        const selectedEntity = entitySelect.value;
        renderChart(selectedEntity);
    });

    loadAllCsvData();
});