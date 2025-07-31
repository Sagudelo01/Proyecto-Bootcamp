document.addEventListener('DOMContentLoaded', () => {
    const consumptionInput = document.getElementById('consumption');
    const entitySelect = document.getElementById('entitySelect');
    const yearSelect = document.getElementById('yearSelect');
    const estimationForm = document.getElementById('estimationForm');
    const resultsDiv = document.getElementById('results');
    const selectedConsumptionP = document.getElementById('selectedConsumption');
    const selectedEntityYearP = document.getElementById('selectedEntityYear');
    const renewableSharePercentageP = document.getElementById('renewableSharePercentage');
    const userRenewableConsumptionP = document.getElementById('userRenewableConsumption');

    let renewableData = []; // Para almacenar los datos del CSV
    let entities = new Set();
    let yearsByEntity = {};

    // Función para cargar y procesar el CSV
    async function loadCSV() {
        try {
            const response = await fetch('../prueba calculadora/renewable-share-energy.csv');
            const csvText = await response.text();
            
            // Parse CSV manually
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(header => header.trim());
            
            // Find column indices
            const entityColIndex = headers.indexOf('Entity');
            const yearColIndex = headers.indexOf('Year');
            const renewableShareColIndex = headers.indexOf('Renewables (% equivalent primary energy)');

            if (entityColIndex === -1 || yearColIndex === -1 || renewableShareColIndex === -1) {
                throw new Error('CSV headers missing required columns: Entity, Year, Renewables (% equivalent primary energy)');
            }

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line === '') continue; // Skip empty lines

                const values = line.split(',');
                if (values.length > Math.max(entityColIndex, yearColIndex, renewableShareColIndex)) {
                    const entity = values[entityColIndex]?.trim();
                    const year = parseInt(values[yearColIndex]?.trim());
                    // El porcentaje ya viene directo.
                    const renewableShare = parseFloat(values[renewableShareColIndex]?.trim());

                    if (entity && !isNaN(year) && !isNaN(renewableShare)) {
                        renewableData.push({ entity, year, renewableShare });
                        entities.add(entity);
                        if (!yearsByEntity[entity]) {
                            yearsByEntity[entity] = new Set();
                        }
                        yearsByEntity[entity].add(year);
                    }
                }
            }
            populateEntities();
        } catch (error) {
            console.error('Error loading or parsing CSV:', error);
            alert('Error al cargar los datos de energía renovable. Por favor, asegúrate de que el archivo "renewable-share-energy.csv" esté en la misma carpeta y sea válido.');
        }
    }

    // Rellenar el select de entidades
    function populateEntities() {
        entitySelect.innerHTML = '<option value="">-- Selecciona una entidad --</option>';
        Array.from(entities).sort().forEach(entity => {
            const option = document.createElement('option');
            option.value = entity;
            option.textContent = entity;
            entitySelect.appendChild(option);
        });
        entitySelect.disabled = false;
    }

    // Rellenar el select de años basado en la entidad seleccionada
    entitySelect.addEventListener('change', () => {
        const selectedEntity = entitySelect.value;
        yearSelect.innerHTML = '<option value="">-- Selecciona un año --</option>';
        if (selectedEntity && yearsByEntity[selectedEntity]) {
            Array.from(yearsByEntity[selectedEntity]).sort((a, b) => a - b).forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
            yearSelect.disabled = false;
        } else {
            yearSelect.disabled = true;
        }
    });

    // Manejar el envío del formulario
    estimationForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const consumption = parseFloat(consumptionInput.value);
        const selectedEntity = entitySelect.value;
        const selectedYear = parseInt(yearSelect.value);

        if (isNaN(consumption) || consumption <= 0 || !selectedEntity || isNaN(selectedYear)) {
            alert('Por favor, ingresa un consumo válido y selecciona una entidad y un año.');
            return;
        }

        const dataEntry = renewableData.find(d => d.entity === selectedEntity && d.year === selectedYear);

        if (dataEntry) {
            const renewableSharePercentage = dataEntry.renewableShare; // Porcentaje directo del CSV

            // Calcular el consumo de energía renovable del usuario
            const userRenewableConsumptionKWH = (consumption * renewableSharePercentage) / 100;

            // Mostrar resultados
            selectedConsumptionP.textContent = `Tu Consumo Ingresado: ${consumption.toLocaleString()} kWh/año`;
            selectedEntityYearP.textContent = `Entidad y Año Seleccionados: ${selectedEntity}, ${selectedYear}`;
            renewableSharePercentageP.textContent = `Porcentaje de Energía Renovable en la mezcla energética de ${selectedEntity} (${selectedYear}): ${renewableSharePercentage.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
            userRenewableConsumptionP.textContent = `De tu consumo anual, aproximadamente ${userRenewableConsumptionKWH.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh provienen de fuentes renovables, según la mezcla energética de la entidad.`;
            
            resultsDiv.style.display = 'block';

        } else {
            resultsDiv.style.display = 'none';
            alert(`No se encontraron datos de porcentaje de energía renovable para ${selectedEntity} en el año ${selectedYear}.`);
        }
    });

    // Cargar los datos al inicio
    loadCSV();
});