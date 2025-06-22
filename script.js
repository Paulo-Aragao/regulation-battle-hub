document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const cardGrid = document.getElementById('cardGrid');
    const searchInput = document.getElementById('searchInput');
    const filtersContainer = document.getElementById('filtersContainer');
    const paginationContainer = document.getElementById('pagination');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalCardDetails = document.getElementById('modalCardDetails');

    // Estado da aplicação
    let allCards = [];
    let filteredCards = [];
    let currentPage = 1;
    const cardsPerPage = 100;
    const activeFilters = {};

    // URL da API de imagens
    const imageUrlBase = 'https://images.digimoncard.io/images/cards/';

    // Função principal para buscar e inicializar os dados
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

    // Cria os selects de filtro dinamicamente
    function populateFilters() {
        const filterKeys = ['type', 'color', 'rarity', 'attribute'];
        filterKeys.forEach(key => {
            const values = [...new Set(allCards.map(card => card[key]).filter(Boolean))].sort();
            
            const select = document.createElement('select');
            select.classList.add('filter-select');
            select.dataset.filterKey = key;

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = `Todos os ${key.charAt(0).toUpperCase() + key.slice(1)}s`;
            select.appendChild(defaultOption);

            values.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
            filtersContainer.appendChild(select);
        });
    }

    // Adiciona os event listeners para interatividade
    function addEventListeners() {
        searchInput.addEventListener('input', handleFiltering);
        filtersContainer.addEventListener('change', handleFiltering);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Função central que aplica filtros e busca
    function handleFiltering(event) {
        const filterKey = event.target.dataset.filterKey;
        if (filterKey) {
            activeFilters[filterKey] = event.target.value;
        }

        const searchTerm = searchInput.value.toLowerCase().trim();

        filteredCards = allCards.filter(card => {
            // Lógica de busca
            const searchMatch = !searchTerm ||
                card.name.toLowerCase().includes(searchTerm) ||
                card.id.toLowerCase().includes(searchTerm) ||
                (card.attribute && card.attribute.toLowerCase().includes(searchTerm)) ||
                (card.digi_type && card.digi_type.toLowerCase().includes(searchTerm));

            // Lógica de filtros
            const filterMatch = Object.entries(activeFilters).every(([key, value]) => {
                return !value || card[key] === value;
            });

            return searchMatch && filterMatch;
        });
        
        currentPage = 1;
        renderPage();
    }
    
    // Renderiza a página atual com os cards e a paginação
    function renderPage() {
        renderCardGrid();
        renderPagination();
    }

    // Renderiza a grade de cards
    function renderCardGrid() {
        cardGrid.innerHTML = ''; // Limpa a grade
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
            cardImage.loading = 'lazy'; // Otimização de performance

            cardContainer.appendChild(cardImage);
            cardContainer.addEventListener('click', () => showModal(card.id));
            fragment.appendChild(cardContainer);
        });
        cardGrid.appendChild(fragment);
    }
    
    // Renderiza os controles de paginação
    function renderPagination() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
        if (totalPages <= 1) return;

        // Botão "Anterior"
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

        // Indicador de página
        const pageIndicator = document.createElement('span');
        pageIndicator.textContent = `Página ${currentPage} de ${totalPages}`;
        paginationContainer.appendChild(pageIndicator);
        
        // Botão "Próximo"
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

    // Mostra o modal com os detalhes do card
    function showModal(cardId) {
        const card = allCards.find(c => c.id === cardId);
        if (!card) return;

        modalCardDetails.innerHTML = `
            <img src="${imageUrlBase}${card.id}.jpg" alt="${card.name}">
            <div class="info">
                <h2>${card.name} (${card.id})</h2>
                <p><strong>Tipo:</strong> ${card.type || 'N/A'}</p>
                <p><strong>Cor:</strong> ${card.color || 'N/A'}</p>
                <p><strong>Raridade:</strong> ${card.rarity.toUpperCase()}</p>
                <p><strong>Set:</strong> ${card.set_name.join(', ') || 'N/A'}</p>
                ${card.level ? `<p><strong>Nível:</strong> ${card.level}</p>` : ''}
                ${card.dp ? `<p><strong>DP:</strong> ${card.dp}</p>` : ''}
                ${card.play_cost ? `<p><strong>Custo de Jogo:</strong> ${card.play_cost}</p>` : ''}
                ${card.attribute ? `<p><strong>Atributo:</strong> ${card.attribute}</p>` : ''}
                ${card.form ? `<p><strong>Forma:</strong> ${card.form}</p>` : ''}
                <hr>
                ${card.main_effect ? `<p><strong>Efeito Principal:</strong><br>${card.main_effect}</p>` : ''}
                ${card.source_effect ? `<p><strong>Efeito de Fonte (Segurança):</strong><br>${card.source_effect}</p>` : ''}
            </div>
        `;
        modalOverlay.classList.remove('hidden');
    }

    // Fecha o modal
    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    // Inicia a aplicação
    initializeApp();
});