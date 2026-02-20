document.addEventListener('DOMContentLoaded', async () => {
    const chartCanvas = document.getElementById('pieChart');
    const entitySelect = document.getElementById('pieEntitySelect'); // CAMBIADO EL ID
    const yearSelect = document.getElementById('pieYearSelect');     // CAMBIADO EL ID
    const applyFilterButton = document.getElementById('applyPieFilter'); // CAMBIADO EL ID

    let myPieChart = null;

    let allShareData = {
        'hydro': [],
        'solar': [],
        'wind': [],
        'renewables_total': []
    };
    let allEntities = new Set(); // Nota: Estas entidades son específicas para este gráfico
    let allYears = new Set();

    const energyConfig = {
        'hydro': {
            fileName: '../Dashboard/data/share-electricity-hydro.csv',
            dataColumn: 'Hydro (% electricity)',
            label: 'Hidroeléctrica',
            color: 'rgba(54, 162, 235, 0.7)'
        },
        'solar': {
            fileName: '../Dashboard/data/share-electricity-solar.csv',
            dataColumn: 'Solar (% electricity)',
            label: 'Solar',
            color: 'rgba(255, 206, 86, 0.7)'
        },
        'wind': {
            fileName: '../Dashboard/data/share-electricity-wind.csv',
            dataColumn: 'Wind (% electricity)',
            label: 'Eólica',
            color: 'rgba(75, 192, 192, 0.7)'
        },
        'renewables_total': {
            fileName: '../Dashboard/data/share-electricity-renewables.csv',
            dataColumn: 'Renewables (% electricity)',
            label: 'Total Renovables',
            color: 'rgba(153, 102, 255, 0.7)'
        },
        'other_renewables': {
            label: 'Otras Renovables',
            color: 'rgba(201, 203, 207, 0.7)'
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

            parsedData.forEach(row => {
                allEntities.add(row.Entity);
                allYears.add(row.Year);
            });

            return parsedData;

        } catch (error) {
            console.error(`Error al cargar o procesar el archivo CSV ${fileName}:`, error);
            // alert(`No se pudo cargar el archivo de datos: ${fileName}. Asegúrate de que estén en la carpeta 'data'.`); // Eliminar alert
            return [];
        }
    }

    async function loadAllShareData() {
        const [hydroRawData, solarRawData, windRawData, renewablesTotalRawData] = await Promise.all([
            fetchAndParseCsv(energyConfig.hydro.fileName),
            fetchAndParseCsv(energyConfig.solar.fileName),
            fetchAndParseCsv(energyConfig.wind.fileName),
            fetchAndParseCsv(energyConfig.renewables_total.fileName)
        ]);

        allShareData.hydro = hydroRawData;
        allShareData.solar = solarRawData;
        allShareData.wind = windRawData;
        allShareData.renewables_total = renewablesTotalRawData;

        Array.from(allEntities).sort().forEach(entity => {
            const option = document.createElement('option');
            option.value = entity;
            option.textContent = entity;
            entitySelect.appendChild(option);
        });

        Array.from(allYears).sort((a, b) => parseInt(a) - parseInt(b)).forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        if (allEntities.has('World')) {
            entitySelect.value = 'World';
        }

        // Establece el año por defecto a '2021' explícitamente
        if (Array.from(allYears).includes('2021')) {
            yearSelect.value = '2021';
        } else if (allYears.size > 0) {
            yearSelect.value = Array.from(allYears).sort((a, b) => parseInt(b) - parseInt(a))[0];
        }

        renderPieChart(entitySelect.value, yearSelect.value);
    }

    function renderPieChart(selectedEntity, selectedYear) {
        let labels = [];
        let data = [];
        let backgroundColors = [];

        const getShareValue = (energyTypeKey) => {
            const config = energyConfig[energyTypeKey];
            const foundRow = allShareData[energyTypeKey].find(row =>
                row.Entity === selectedEntity && row.Year === selectedYear
            );
            return foundRow ? parseFloat(foundRow[config.dataColumn]) : 0;
        };

        const hydroShare = getShareValue('hydro');
        const solarShare = getShareValue('solar');
        const windShare = getShareValue('wind');
        const renewablesTotalShare = getShareValue('renewables_total');

        const knownRenewablesSum = hydroShare + solarShare + windShare;

        let otherRenewablesShare = 0;
        if (renewablesTotalShare > knownRenewablesSum) {
            otherRenewablesShare = renewablesTotalShare - knownRenewablesSum;
        }

        if (hydroShare > 0) {
            labels.push(energyConfig.hydro.label);
            data.push(hydroShare);
            backgroundColors.push(energyConfig.hydro.color);
        }
        if (solarShare > 0) {
            labels.push(energyConfig.solar.label);
            data.push(solarShare);
            backgroundColors.push(energyConfig.solar.color);
        }
        if (windShare > 0) {
            labels.push(energyConfig.wind.label);
            data.push(windShare);
            backgroundColors.push(energyConfig.wind.color);
        }
        if (otherRenewablesShare > 0) {
            labels.push(energyConfig.other_renewables.label);
            data.push(otherRenewablesShare);
            backgroundColors.push(energyConfig.other_renewables.color);
        }

        if (data.length === 0) {
             if (myPieChart) {
                myPieChart.destroy();
                myPieChart = null;
            }
            const ctx = chartCanvas.getContext('2d');
            ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#888';
            ctx.fillText('No hay datos de energías renovables para esta selección.', chartCanvas.width / 2, chartCanvas.height / 2);
            return;
        }

        if (myPieChart) {
            myPieChart.destroy();
        }

        myPieChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value.toFixed(2)}% (${percentage}%)`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: `Distribución de Energías Renovables en ${selectedEntity} (${selectedYear})`
                    }
                }
            }
        });
    }

    applyFilterButton.addEventListener('click', () => {
        const selectedEntity = entitySelect.value;
        const selectedYear = yearSelect.value;
        renderPieChart(selectedEntity, selectedYear);
    });

    loadAllShareData();
});