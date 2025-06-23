document.addEventListener('DOMContentLoaded', () => {
    const cardGrid = document.getElementById('cardGrid');
    const searchInput = document.getElementById('searchInput');
    const filtersContainer = document.getElementById('filtersContainer');
    const paginationContainer = document.getElementById('pagination');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalCardDetails = document.getElementById('modalCardDetails');

    let allCards = [];
    let filteredCards = [];
    let currentPage = 1;
    const cardsPerPage = 100;
    const activeFilters = {};

    const imageUrlBase = 'https://images.digimoncard.io/images/cards/';

    async function initializeApp() {
        try {
            const response = await fetch('./data/digimon_cards_full.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allCards = await response.json();
            filteredCards = [...allCards];
            populateFilters();
            addEventListeners();
            renderPage();
        } catch (error) {
            console.error("Falha ao carregar os dados dos cards:", error);
            cardGrid.innerHTML = '<p>Não foi possível carregar os cards. Tente novamente mais tarde.</p>';
        }
    }

    function populateFilters() {
        const filterKeys = ['type', 'color', 'rarity', 'attribute', 'level'];
        filterKeys.forEach(key => {
            
            const isNumeric = key === 'level';
            let values = [...new Set(allCards.map(card => card[key]).filter(val => val !== null && val !== undefined))];
            
            if (isNumeric) {
                values.sort((a, b) => a - b);
            } else {
                values.sort();
            }
            
            const select = document.createElement('select');
            select.classList.add('filter-select');
            select.dataset.filterKey = key;

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            defaultOption.textContent = `${label}s`;
            select.appendChild(defaultOption);

            values.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
            filtersContainer.appendChild(select);
        });

        const allDigiTypes = new Set(
            allCards.flatMap(card => [card.digi_type, card.digi_type2]).filter(Boolean)
        );

        if (allDigiTypes.size > 0) {
            const sortedDigiTypes = [...allDigiTypes].sort();
            const select = document.createElement('select');
            select.classList.add('filter-select');
            select.dataset.filterKey = 'digi_type'; 
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Archtypes';
            select.appendChild(defaultOption);
            sortedDigiTypes.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
            filtersContainer.appendChild(select);
        }
        
        const allSets = new Set(
            allCards.flatMap(card => card.set_name).filter(Boolean)
        );

        if (allSets.size > 0) {
            const sortedSets = [...allSets].sort();
            const select = document.createElement('select');
            select.classList.add('filter-select');
            select.dataset.filterKey = 'set_name';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Sets';
            select.appendChild(defaultOption);

            sortedSets.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
            filtersContainer.appendChild(select);
        }
    }

    function addEventListeners() {
        searchInput.addEventListener('input', handleFiltering);
        filtersContainer.addEventListener('change', handleFiltering);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Substitua a função inteira no seu script.js
    function handleFiltering(event) {
        const filterKey = event.target.dataset.filterKey;
        if (filterKey) {
            activeFilters[filterKey] = event.target.value;
        }

        const searchTerm = searchInput.value.toLowerCase().trim();

        filteredCards = allCards.filter(card => {
            // Lógica de busca por texto
            const searchMatch = !searchTerm ||
                card.name.toLowerCase().includes(searchTerm) ||
                card.id.toLowerCase().includes(searchTerm) ||
                (card.attribute && card.attribute.toLowerCase().includes(searchTerm)) ||
                (card.digi_type && card.digi_type.toLowerCase().includes(searchTerm)) ||
                (card.digi_type2 && card.digi_type2.toLowerCase().includes(searchTerm));

            // Lógica dos filtros <select>
            const filterMatch = Object.entries(activeFilters).every(([key, value]) => {
                if (!value) return true; // Se o valor for "" (Todos), não filtra

                // Lógica para o filtro 'digi_type'
                if (key === 'digi_type') {
                    return card.digi_type === value || card.digi_type2 === value;
                }

                // --- LÓGICA NOVA PARA O FILTRO 'SET' ---
                // Verifica se o array set_name da carta inclui o set selecionado
                if (key === 'set_name') {
                    return Array.isArray(card.set_name) && card.set_name.includes(value);
                }
                
                // --- LÓGICA NOVA PARA O FILTRO 'LEVEL' ---
                // Compara o valor como número, não como texto
                if (key === 'level') {
                    return card.level == value; // Usar '==' aqui lida com a coerção de tipo (ex: 7 == "7")
                }

                // Lógica padrão para os outros filtros
                return card[key] === value;
            });

            return searchMatch && filterMatch;
        });
        
        currentPage = 1;
        renderPage();
    }
    

    function renderPage() {
        renderCardGrid();
        renderPagination();
    }

    function renderCardGrid() {
        cardGrid.innerHTML = ''; 
        const startIndex = (currentPage - 1) * cardsPerPage;
        const endIndex = startIndex + cardsPerPage;
        const cardsToRender = filteredCards.slice(startIndex, endIndex);

        if (cardsToRender.length === 0) {
            cardGrid.innerHTML = '<p>Nenhum card encontrado com os filtros selecionados.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        cardsToRender.forEach(card => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';
            cardContainer.dataset.cardId = card.id;

            const cardImage = document.createElement('img');
            cardImage.src = `${imageUrlBase}${card.id}.jpg`;
            cardImage.alt = card.name;
            cardImage.className = 'card-image';
            cardImage.loading = 'lazy';

            cardContainer.appendChild(cardImage);
            cardContainer.addEventListener('click', () => showModal(card.id));
            fragment.appendChild(cardContainer);
        });
        cardGrid.appendChild(fragment);
    }
    
    function renderPagination() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.className = 'page-btn';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage();
            }
        });
        paginationContainer.appendChild(prevButton);

        const pageIndicator = document.createElement('span');
        pageIndicator.textContent = `Página ${currentPage} de ${totalPages}`;
        paginationContainer.appendChild(pageIndicator);
        
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Próximo';
        nextButton.className = 'page-btn';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage();
            }
        });
        paginationContainer.appendChild(nextButton);
    }

     function showModal(cardId) {
        const card = allCards.find(c => c.id === cardId);
        if (!card) return;

        const formatEffectText = (text) => {
        if (!text) return '';

        let formattedText = text.replace(/\[(.*?)\]/g, '<span class="effect-trigger">[$1]</span>');

        formattedText = formattedText.replace(/＜(.*?)＞/g, '<span class="effect-keyword">＜$1＞</span>');

        return formattedText.replace(/\n/g, '<br>');
        };

        const setNameHtml = Array.isArray(card.set_name) ? card.set_name.join(', ') : card.set_name;

        modalCardDetails.innerHTML = `
        <img src="${imageUrlBase}${card.id}.jpg" alt="${card.name}">
        <div class="info">
            <h2>${card.name} (${card.id})</h2>
            <p><strong>Tipo:</strong> ${card.type || 'N/A'}</p>
            <p><strong>Cor:</strong> ${card.color || 'N/A'}</p>
            <p><strong>Raridade:</strong> ${card.rarity ? card.rarity.toUpperCase() : 'N/A'}</p>
            <p><strong>Set:</strong> ${setNameHtml || 'N/A'}</p>
            ${card.level ? `<p><strong>Nível:</strong> ${card.level}</p>` : ''}
            ${card.dp ? `<p><strong>DP:</strong> ${card.dp}</p>` : ''}
            ${card.play_cost ? `<p><strong>Custo de Jogo:</strong> ${card.play_cost}</p>` : ''}
            ${card.attribute ? `<p><strong>Atributo:</strong> ${card.attribute}</p>` : ''}
            ${card.form ? `<p><strong>Forma:</strong> ${card.form}</p>` : ''}
            <hr>
            ${card.main_effect ? `<p><strong>Efeito Principal:</strong><br>${formatEffectText(card.main_effect)}</p>` : ''}
            ${card.source_effect ? `<p><strong>Efeito de Herança:</strong><br>${formatEffectText(card.source_effect)}</p>` : ''}
        </div>
        `;
        modalOverlay.classList.remove('hidden');
        }

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    initializeApp();
});