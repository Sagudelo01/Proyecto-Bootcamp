document.addEventListener('DOMContentLoaded', function() {
            const fileOptions = document.querySelectorAll('.file-option'); // Seleccionamos las nuevas divs de opción
            const tableHead = document.querySelector('#dataTable thead');
            const tableBody = document.querySelector('#dataTable tbody');
            
            let currentData = [];
            let currentHeaders = [];
            const filterableColumns = ['Entity', 'Code', 'Year'];

            // Function to fetch and parse CSV
            async function fetchAndParseCsv(filePath) {
                try {
                    const response = await fetch(filePath);
                    if (!response.ok) {
                        throw new Error(`Error fetching CSV: ${response.statusText}`);
                    }
                    const csvText = await response.text();
                    const rows = csvText.split('\n').filter(row => row.trim() !== '');
                    
                    if (rows.length === 0) {
                        return { headers: [], data: [] };
                    }

                    const headers = rows[0].split(',').map(h => h.trim().replace(/\r/g, ''));
                    const data = rows.slice(1).map(row => row.split(',').map(cell => cell.trim().replace(/\r/g, '')));
                    
                    return { headers, data };

                } catch (error) {
                    console.error('Error loading CSV:', error);
                    tableBody.innerHTML = `<tr><td colspan="${currentHeaders.length || 1}" style="text-align: center; color: red; padding: 20px;">Error loading data for "${filePath}". Please ensure the file exists and is correctly formatted.<br>${error.message}</td></tr>`;
                    return { headers: [], data: [] };
                }
            }

            // Function to render table headers and filter dropdowns
            function renderTableHeaders(headers) {
                tableHead.innerHTML = '';
                const headerRow = document.createElement('tr');
                
                headers.forEach((headerText, index) => {
                    const th = document.createElement('th');
                    const div = document.createElement('div');
                    div.textContent = headerText;

                    if (filterableColumns.includes(headerText)) {
                        const select = document.createElement('select');
                        select.classList.add('filter-select');
                        select.setAttribute('data-column-index', index);
                        select.setAttribute('data-column-name', headerText);

                        const allOption = document.createElement('option');
                        allOption.value = "";
                        allOption.textContent = `All ${headerText}s`;
                        select.appendChild(allOption);
                        
                        div.appendChild(select);
                    }
                    th.appendChild(div);
                    headerRow.appendChild(th);
                });
                tableHead.appendChild(headerRow);
            }

            // Function to populate dropdowns with unique values
            function populateDropdowns(data, headers) {
                const filterSelects = document.querySelectorAll('.filter-select');
                
                filterSelects.forEach(select => {
                    const columnIndex = parseInt(select.getAttribute('data-column-index'));
                    const headerName = select.getAttribute('data-column-name');
                    
                    select.innerHTML = `<option value="">All ${headerName}s</option>`;

                    const uniqueValues = new Set();
                    data.forEach(row => {
                        if (row[columnIndex] !== undefined && row[columnIndex].trim() !== '') {
                            uniqueValues.add(row[columnIndex]);
                        }
                    });

                    Array.from(uniqueValues).sort().forEach(value => {
                        const option = document.createElement('option');
                        option.value = value;
                        option.textContent = value;
                        select.appendChild(option);
                    });
                    
                    select.removeEventListener('change', renderFilteredRows);
                    select.addEventListener('change', renderFilteredRows);
                });
            }

            // Function to render rows based on current filters
            function renderFilteredRows() {
                tableBody.innerHTML = '';
                const fragment = document.createDocumentFragment();
                const filterSelects = document.querySelectorAll('.filter-select');

                const currentFilters = Array.from(filterSelects).map(select => {
                    return {
                        columnIndex: parseInt(select.getAttribute('data-column-index')),
                        value: select.value.toLowerCase()
                    };
                });

                currentData.forEach(rowData => {
                    let match = true;
                    currentFilters.forEach(filter => {
                        if (filter.value) {
                            if (rowData[filter.columnIndex] === undefined || rowData[filter.columnIndex].toLowerCase() !== filter.value) {
                                match = false;
                                return;
                            }
                        }
                    });

                    if (match) {
                        const tr = document.createElement('tr');
                        rowData.forEach(cellData => {
                            const td = document.createElement('td');
                            td.textContent = cellData;
                            tr.appendChild(td);
                        });
                        fragment.appendChild(tr);
                    }
                });
                tableBody.appendChild(fragment);
            }

            // Main function to load and display data for a selected file
            async function loadDataForFile(filePath, selectedElement) {
                // Remove 'selected-file' class from all options
                fileOptions.forEach(option => option.classList.remove('selected-file'));
                
                // Add 'selected-file' class to the clicked element
                if (selectedElement) {
                    selectedElement.classList.add('selected-file');
                }

                const { headers, data } = await fetchAndParseCsv(filePath);
                currentHeaders = headers;
                currentData = data;

                renderTableHeaders(headers);
                populateDropdowns(data, headers);
                renderFilteredRows();
            }

            // Add event listeners for file selection options (now divs with class file-option)
            fileOptions.forEach(option => {
                option.addEventListener('click', (event) => {
                    const filePath = event.target.getAttribute('data-file');
                    loadDataForFile(filePath, event.target);
                });
            });

            // Initial load: Load the first file and mark it as selected
            if (fileOptions.length > 0) {
                const initialFilePath = fileOptions[0].getAttribute('data-file');
                loadDataForFile(initialFilePath, fileOptions[0]); // Pass the element to mark it selected
            }
        });