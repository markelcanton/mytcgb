let jsonFile = '';
let gridType = '2x2'; 

let allPagesData = []; 
let currentPage = 1;   

function showEmptyMessage() {
    const bookContainer = document.getElementById('binder-book');
    if (bookContainer) {
        bookContainer.innerHTML = `
            <div class="page-side" style="display: flex; align-items: center; justify-content: center; text-align: center; margin: 0 auto; border-radius: 8px;">
                <div style="color: #8b949e; padding: 20px; font-size: 22px; font-family: sans-serif;">
                    Este álbum aún no tiene datos configurados.
                </div>
            </div>
        `;
    }
}

function toggleNavigation(show) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageSelect = document.querySelector('.page-select-container');
    const viewModeContainer = document.getElementById('view-mode-container'); 

    const display = show ? '' : 'none'; 
    
    if (prevBtn) prevBtn.style.display = display;
    if (nextBtn) nextBtn.style.display = display;
    if (pageSelect) pageSelect.style.display = display;
    if (viewModeContainer) viewModeContainer.style.display = display;
}

async function loadAllBinders() {
    try {
        const response = await fetch(jsonFile);
        if (!response.ok) throw new Error(`Error al cargar el archivo JSON "${jsonFile}"`);
        
        const data = await response.json();
        allPagesData = data.pages.sort((a, b) => a.number - b.number);

        initNavigation();
        renderCurrentView();
    } catch (error) {
        console.error("Error al cargar el archivo: ", error);
        
        allPagesData = []; 
        currentPage = 1;
        
        showEmptyMessage(); 
        
        const input = document.getElementById('page-input');
        const totalLabel = document.getElementById('total-pages-label');
        if (input) input.value = '0';
        if (totalLabel) totalLabel.textContent = '/ 0';
        
        toggleNavigation(false);
    }
}

function initNavigation() {
    const input = document.getElementById('page-input');
    const totalLabel = document.getElementById('total-pages-label');
    if (!input) return;

    const totalPages = allPagesData.length;
    totalLabel.textContent = `/ ${totalPages}`;
    currentPage = 1;
}

function getCurrentMode() {
    const isMobile = window.innerWidth < 768;
    const select = document.getElementById('view-mode-select');
    return isMobile ? 'single' : (select ? select.value : 'double');
}

function goToPage(target) {
    if (!allPagesData || allPagesData.length === 0) return;

    let parsedTarget = target.toString().split('-')[0].trim();
    let targetPage = parseInt(parsedTarget);

    if (isNaN(targetPage)) targetPage = 1;

    const totalPages = allPagesData.length;
    if (targetPage > totalPages) targetPage = totalPages;
    if (targetPage < 1) targetPage = 1;

    currentPage = targetPage;
    renderCurrentView();
}

function renderCurrentView() {
    if (!allPagesData || allPagesData.length === 0) return;

    const hasData = allPagesData && allPagesData.length > 0;
    toggleNavigation(hasData);
    if (!hasData) {
        showEmptyMessage();
        return; 
    }

    const bookContainer = document.getElementById('binder-book');
    const pageInput = document.getElementById('page-input');
    if (!bookContainer) return;
    
    bookContainer.innerHTML = ''; 
    const mode = getCurrentMode();
    const totalPages = allPagesData.length;

    if (mode === 'single') {
        const side = document.createElement('div');
        side.className = 'page-side'; 
        side.style.borderRadius = '8px';
        buildPageHTML(side, currentPage);
        bookContainer.appendChild(side);
        
        if (pageInput) pageInput.value = currentPage;

    } else {
        if (currentPage === 1) {
            const coverSide = document.createElement('div');
            coverSide.className = 'page-side left-side cover-page';
            coverSide.innerHTML = '<div class="cover-title"></div>';
            bookContainer.appendChild(coverSide);

            const rightSide = document.createElement('div');
            rightSide.className = 'page-side right-side';
            buildPageHTML(rightSide, 1);
            bookContainer.appendChild(rightSide);
            
            if (pageInput) pageInput.value = '1';
        } else {
            let leftPageNum = currentPage % 2 === 0 ? currentPage : currentPage - 1;
            let rightPageNum = leftPageNum + 1;

            const leftSide = document.createElement('div');
            leftSide.className = 'page-side left-side';
            buildPageHTML(leftSide, leftPageNum);
            bookContainer.appendChild(leftSide);

            const rightSide = document.createElement('div');
            rightSide.className = 'page-side right-side';
            
            const existePaginaDerecha = allPagesData.some(p => p.number === rightPageNum);
            
            if (existePaginaDerecha) {
                buildPageHTML(rightSide, rightPageNum);
            } else {
                rightSide.classList.add('cover-page'); 
                rightSide.innerHTML = '<div class="cover-title"></div>';
            }
            bookContainer.appendChild(rightSide);
            
            if (pageInput) pageInput.value = rightPageNum > totalPages ? `${leftPageNum}` : `${leftPageNum}-${rightPageNum}`;
        }
    }
}

function buildPageHTML(sideContainer, pageNumber) {
    sideContainer.innerHTML = `<div class="page-number-indicator">Pág. ${pageNumber}</div>`;

    const gridDiv = document.createElement('div');
    const jsonDataPage = allPagesData.find(p => p.number === pageNumber);
    const esPaginaJumbo = jsonDataPage && jsonDataPage.jumbo === true;

    if (esPaginaJumbo) {
        gridDiv.className = 'cards-grid-jumbo';
    } else {
        gridDiv.className = `cards-grid-${gridType}`;
    }
    
    const cardsMap = {};
    if (jsonDataPage && jsonDataPage.cards) {
        jsonDataPage.cards.forEach(card => {
            cardsMap[card.slot.toString()] = card;
        });
    }

    const totalSlots = esPaginaJumbo ? 1 : (gridType === '3x3' ? 9 : 4);

    for (let slot = 1; slot <= totalSlots; slot++) {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        if (esPaginaJumbo) cardItem.classList.add('jumbo-item');

        const cardData = cardsMap[slot.toString()];
        if (cardData) {
            const imgSrc = cardData.image ? cardData.image.trim() : '';
            
            const tieneNoTrade = cardData.noTrade === true || 
                (cardData.price && cardData.price.toUpperCase().includes("NO TRADE")) ||
                (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("NO TRADE")));

            const tieneReservada = cardData.reservada === true || 
                (cardData.price && cardData.price.toUpperCase().includes("RESERVADA")) ||
                (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("RESERVADA")));

            let badgesHTML = '';
            if (tieneNoTrade) badgesHTML += `<div class="no-trade-badge">NO TRADE</div>`;
            if (tieneReservada) badgesHTML += `<div class="reserved-badge">RESERVADA</div>`;

            if (imgSrc) {
                cardItem.innerHTML = `${badgesHTML}<img src="${imgSrc}" alt="Pokémon Card" onerror="this.onerror=null; this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg';">`;
            } else {
                cardItem.innerHTML = `<div class="empty-slot"></div>`;
            }
            cardItem.addEventListener('click', () => showDetails(cardData, pageNumber));
        } else {
            cardItem.classList.add('slot-vacio');
            cardItem.innerHTML = `<div class="empty-slot"></div>`;
        }
        gridDiv.appendChild(cardItem);
    }
    
    sideContainer.appendChild(gridDiv);
}

function showDetails(card, pageNum) {
    const modal = document.getElementById('card-modal');
    const modalBody = document.getElementById('modal-body');

    let infoHtml = `<p><strong>Expansión:</strong> ${card.expansion || '--'} (${card.code || '--'})</p>`;
    // if (card.date && card.date.trim() !== "") infoHtml += `<p><strong>Fecha de obtención:</strong> ${card.date}</p>`;

    const variantsList = (card.variants && card.variants.length > 0) 
        ? card.variants 
        : [{
            language: card.language || '--',
            type: card.type || '--',
            format: card.format || '--',
            condition: card.condition || '--',
            price: card.price || '--',
            'cardmarket-link': card['cardmarket-link'] || ''
        }];

    const rowsHtml = variantsList.map(v => {
        const tieneLink = v['cardmarket-link'] && v['cardmarket-link'].trim() !== '';
        const linkBtn = tieneLink 
            ? `<a href="${v['cardmarket-link'].trim()}" target="_blank" class="cm-table-btn" alt="Ver precio en Cardmarket" title="Ver precio en Cardmarket">Ver</a>` 
            : '--';

        return `
            <tr>
                <td>${v.language || '--'}</td>
                <td>${v.type || '--'}</td>
                <td>${v.format || '--'}</td>
                <td>${v.condition || '--'}</td>
                <td><span class="price-tag">${v.price || '--'}</span></td>
                <td>${v.stock || '--'}</td>
                <td>${linkBtn}</td>
            </tr>
        `;
    }).join('');

    const tableHtml = `
        <div id="available-list" class="available-list" style="display: none;">
            <div class="table-responsive">
                <table class="available-table">
                    <thead>
                        <tr>
                            <th>Idioma:</th>
                            <th>Tipo:</th>
                            <th>Regulación:</th>
                            <th>Estado:</th>
                            <th>Precio (CM):</th>
                            <th>Stock:</th>
                            <th>Link a CM:</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
        <button id="btn-disponibles" class="btn-disponibles">Ver disponibles (${variantsList.length})</button>
    `;

    modalBody.innerHTML = `
        <div class="modal-img">
            <img src="${card.image || ''}" style="width:100%; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.6);" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'">
        </div>
        <div class="modal-info">
            <h2 style="margin-top:0; color:white;">${card.name || 'Sin nombre'}</h2>
            <div class="info-grid">
                ${infoHtml}
            </div>
            ${tableHtml}
        </div>
    `;
    
    modal.style.display = 'flex';

    const btnDisponibles = document.getElementById('btn-disponibles');
    const availableList = document.getElementById('available-list');
    
    if (btnDisponibles && availableList) {
        btnDisponibles.addEventListener('click', () => {
            if (availableList.style.display === 'none') {
                availableList.style.display = 'block';
                btnDisponibles.textContent = 'Ocultar disponibles';
                btnDisponibles.classList.add('btn-active');
            } else {
                availableList.style.display = 'none';
                btnDisponibles.textContent = `Ver disponibles (${variantsList.length})`;
                btnDisponibles.classList.remove('btn-active');
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const albumSelect = document.getElementById('album-select');
    const viewModeSelect = document.getElementById('view-mode-select');
    
    function handleAlbumChange() {
        if (albumSelect) {
            jsonFile = albumSelect.value;
            gridType = albumSelect.options[albumSelect.selectedIndex].getAttribute('data-grid') || '2x2';
            currentPage = 1;
            loadAllBinders();
        }
    }

    if (albumSelect) albumSelect.addEventListener('change', handleAlbumChange);
    if (viewModeSelect) viewModeSelect.addEventListener('change', renderCurrentView);

    window.addEventListener('resize', renderCurrentView);

    handleAlbumChange();

    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('card-modal').style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('card-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    const pageInput = document.getElementById('page-input');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.addEventListener('click', () => {
        const mode = getCurrentMode();
        if (mode === 'single') {
            goToPage(currentPage - 1);
        } else {
            if (currentPage === 1) return;
            let left = currentPage % 2 === 0 ? currentPage : currentPage - 1;
            goToPage(left - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        const mode = getCurrentMode();
        if (mode === 'single') {
            goToPage(currentPage + 1);
        } else {
            if (currentPage === 1) {
                goToPage(2);
            } else {
                let left = currentPage % 2 === 0 ? currentPage : currentPage - 1;
                goToPage(left + 2);
            }
        }
    });

    pageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            goToPage(e.target.value);
            e.target.blur();
        }
    });

    pageInput.addEventListener('blur', () => {
        renderCurrentView(); 
    });
});
