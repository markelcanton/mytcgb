let jsonFile = '';
let gridType = '2x2';

let allPagesData = [];
let currentPage = 1;

let isAnimating = false;

let expansionChronologicalOrder = [];
let allAlbumsMasterData = [];
let allExpansionsMasterData = [];
let allLanguagesMasterData = [];
let allConditionsMasterData = [];
let allTypesMasterData = [];

let selectedExpansions = [];
let selectedLanguages = [];
let selectedConditions = [];
let selectedTypes = [];

let activeSelectorTarget = 'expansion';
let activeExpansionTarget = 'main';

let currentActiveSetIndex = 0;
let currentActiveSeriesIndex = 0;
let lastSearchResults = [];

function ensureBackdrop() {
    let backdrop = document.getElementById('modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'modal-backdrop';
        document.body.appendChild(backdrop);
    }
    return backdrop;
}

function openModal(modal) {
    if (!modal) return;
    const backdrop = ensureBackdrop();

    backdrop.classList.add('active');

    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');

    setTimeout(() => {
        modal.style.display = 'none';

        const anyActive = document.querySelector('.modal-overlay.active');
        if (!anyActive) {
            const backdrop = document.getElementById('modal-backdrop');
            if (backdrop) backdrop.classList.remove('active');
        }
    }, 200);
}

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

function toggleControlsDisabled(disable) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInput = document.getElementById('page-input');
    const navContainer = document.querySelector('.nav-buttons-container');

    if (prevBtn) prevBtn.disabled = disable;
    if (nextBtn) nextBtn.disabled = disable;
    if (pageInput) pageInput.disabled = disable;

    if (navContainer) {
        if (disable) {
            navContainer.classList.add('disabled-controls');
        } else {
            navContainer.classList.remove('disabled-controls');
        }
    }
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
    if (isAnimating || !allPagesData || allPagesData.length === 0) return;

    let parsedTarget = target.toString().split('-')[0].trim();
    let targetPage = parseInt(parsedTarget);

    if (isNaN(targetPage)) targetPage = 1;

    const totalPages = allPagesData.length;
    if (targetPage > totalPages) targetPage = totalPages;
    if (targetPage < 1) targetPage = 1;

    if (currentPage === targetPage) return;

    const bookContainer = document.getElementById('binder-book');
    if (!bookContainer) {
        currentPage = targetPage;
        renderCurrentView();
        return;
    }

    isAnimating = true;
    toggleControlsDisabled(true);

    const mode = getCurrentMode();
    const esAvanzar = targetPage > currentPage;

    if (mode === 'single') {
        const singlePage = bookContainer.querySelector('.page-side');
        if (singlePage) {
            singlePage.classList.add(esAvanzar ? 'flip-single-next' : 'flip-single-prev');
        }
    } else {
        if (esAvanzar) {
            const rightSide = bookContainer.querySelector('.right-side');
            if (rightSide) rightSide.classList.add('flip-to-left');
        } else {
            const leftSide = bookContainer.querySelector('.left-side');
            if (leftSide) leftSide.classList.add('flip-to-right');
        }
    }

    setTimeout(() => {
        currentPage = targetPage;
        renderCurrentView();

        const newSides = bookContainer.querySelectorAll('.page-side');
        newSides.forEach(side => side.classList.add('fade-in-start'));

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                newSides.forEach(side => side.classList.remove('fade-in-start'));
            });
        });

        setTimeout(() => {
            isAnimating = false;
            toggleControlsDisabled(false);
        }, 220);

    }, 220);
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

            const activeColors = [];

            function getCssColor(className) {
                const dummy = document.createElement('div');
                dummy.className = className;
                dummy.style.display = 'none';
                document.body.appendChild(dummy);
                const color = window.getComputedStyle(dummy).backgroundColor;
                document.body.removeChild(dummy);
                return color;
            }

            const tieneNoTrade = cardData.noTrade === true || (cardData.price && cardData.price.toUpperCase().includes("NO TRADE")) || (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("NO TRADE")));
            const tieneReservada = cardData.reservada === true || (cardData.price && cardData.price.toUpperCase().includes("RESERVADA")) || (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("RESERVADA")));
            const tieneVendida = cardData.vendida === true || (cardData.price && cardData.price.toUpperCase().includes("VENDIDA")) || (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("VENDIDA")));
            const tieneTraded = cardData.traded === true || (cardData.price && cardData.price.toUpperCase().includes("TRADED")) || (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("TRADED")));
            const tieneNoDisponible = cardData.noDisponible === true || (cardData.price && cardData.price.toUpperCase().includes("NO DISPONIBLE")) || (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("NO DISPONIBLE")));
            const tieneConseguida = cardData.conseguida === true || (cardData.price && cardData.price.toUpperCase().includes("CONSEGUIDA")) || (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("CONSEGUIDA")));

            if (tieneNoTrade) activeColors.push(getCssColor('badge-notrade'));
            if (tieneReservada) activeColors.push(getCssColor('badge-reserved'));
            if (tieneVendida) activeColors.push(getCssColor('badge-sold'));
            if (tieneTraded) activeColors.push(getCssColor('badge-traded'));
            if (tieneNoDisponible) activeColors.push(getCssColor('badge-unavailable'));
            if (tieneConseguida) activeColors.push(getCssColor('badge-conseguida'));

            let dotHtml = '';
            if (activeColors.length === 1) {
                dotHtml = `<div class="card-status-dot" style="background-color: ${activeColors[0]};"></div>`;
            } else if (activeColors.length > 1) {
                let gradientStops = [];
                const total = activeColors.length;
                activeColors.forEach((color, index) => {
                    const startDeg = (index * (360 / total)).toFixed(2);
                    const endDeg = ((index + 1) * (360 / total)).toFixed(2);
                    gradientStops.push(`${color} ${startDeg}deg ${endDeg}deg`);
                });
                dotHtml = `<div class="card-status-dot" style="background: conic-gradient(${gradientStops.join(', ')});"></div>`;
            }

            if (imgSrc) {
                cardItem.innerHTML = `${dotHtml}<img src="${imgSrc}" alt="Pokémon Card" onerror="this.onerror=null; this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg';">`;
            } else {
                cardItem.innerHTML = `<div class="empty-slot"></div>`;
            }
            cardItem.addEventListener('click', () => showDetails(cardData, pageNumber, cardData.slot || slot));
        } else {
            cardItem.classList.add('slot-vacio');
            cardItem.innerHTML = `<div class="empty-slot"></div>`;
        }
        gridDiv.appendChild(cardItem);
    }

    sideContainer.appendChild(gridDiv);
}

function getCurrentBinderId() {
    const albumSelect = document.getElementById('album-select');
    if (albumSelect && albumSelect.selectedIndex >= 0) {
        return albumSelect.options[albumSelect.selectedIndex].getAttribute('data-id') || 'gamegenic';
    }
    return 'gamegenic';
}

function showDetails(card, pageNum, slotNum) {
    const modal = document.getElementById('card-modal');
    const modalBody = document.getElementById('modal-body');

    const binderId = getCurrentBinderId();
    const newParams = new URLSearchParams();
    newParams.set('b', binderId);
    newParams.set('c', '1');
    if (pageNum !== undefined) newParams.set('page', pageNum);
    if (slotNum !== undefined) newParams.set('slot', slotNum);

    window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);

    let expansionText = '--';
    if (Array.isArray(card.expansion)) {
        expansionText = card.expansion.join(', ');
    } else if (card.expansion) {
        expansionText = card.expansion;
    }

    let infoHtml = `<p><strong>Expansión:</strong> ${expansionText}</p>`;

    const tieneNoTrade = card.noTrade === true || (card.price && card.price.toUpperCase().includes("NO TRADE")) || (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("NO TRADE")));
    const tieneReservada = card.reservada === true || (card.price && card.price.toUpperCase().includes("RESERVADA")) || (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("RESERVADA")));
    const tieneVendida = card.vendida === true || (card.price && card.price.toUpperCase().includes("VENDIDA")) || (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("VENDIDA")));
    const tieneTraded = card.traded === true || (card.price && card.price.toUpperCase().includes("TRADED")) || (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("TRADED")));
    const tieneNoDisponible = card.noDisponible === true || (card.price && card.price.toUpperCase().includes("NO DISPONIBLE")) || (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("NO DISPONIBLE")));
    const tieneConseguida = card.conseguida === true || (card.price && card.price.toUpperCase().includes("CONSEGUIDA")) || (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("CONSEGUIDA")));

    let modalBadgesHTML = '';
    if (tieneNoTrade || tieneReservada || tieneVendida || tieneTraded || tieneNoDisponible || tieneConseguida) {
        modalBadgesHTML += `<div style="display:flex; flex-wrap:wrap; gap:6px; margin: 8px 0 12px 0;">`;
        if (tieneNoTrade) modalBadgesHTML += `<span class="card-badge badge-notrade" style="position:static;">NO TRADE</span>`;
        if (tieneReservada) modalBadgesHTML += `<span class="card-badge badge-reserved" style="position:static;">RESERVADA</span>`;
        if (tieneVendida) modalBadgesHTML += `<span class="card-badge badge-sold" style="position:static;">VENDIDA</span>`;
        if (tieneTraded) modalBadgesHTML += `<span class="card-badge badge-traded" style="position:static;">TRADED</span>`;
        if (tieneNoDisponible) modalBadgesHTML += `<span class="card-badge badge-unavailable" style="position:static;">NO DISPONIBLE</span>`;
        if (tieneConseguida) modalBadgesHTML += `<span class="card-badge badge-conseguida" style="position:static;">CONSEGUIDA</span>`;
        modalBadgesHTML += `</div>`;
    }

    const albumSelect = document.getElementById('album-select');
    const selectedOption = albumSelect ? albumSelect.options[albumSelect.selectedIndex] : null;
    const isWishlist = selectedOption && selectedOption.getAttribute('data-id') === 'wishlist';

    const isEditorPage = !!document.getElementById('mode-selector');

    let allVars = (card.variants && card.variants.length > 0) ? card.variants : [{}];
    let visibleVariants = isEditorPage ? allVars : allVars.filter(v => !v.hidden);

    const variant = visibleVariants.length > 0 ? visibleVariants[0] : {};

    if (isWishlist) {
        const conditionVal = card.condition || variant.condition || '--';
        const languageVal = card.language || variant.language || '--';
        const priceVal = card.price || variant.price || '--';

        const hasLink = card['cardmarket-link'] || variant['cardmarket-link'];
        const linkUrl = hasLink ? (card['cardmarket-link'] || variant['cardmarket-link']).trim() : '';
        const cmButtonHtml = linkUrl
            ? `<a href="${linkUrl}" target="_blank" class="cardmarket-btn" style="margin-top:15px;">Ver en Cardmarket</a>`
            : '';

        modalBody.innerHTML = `
            <div class="modal-img">
                <img src="${card.image || ''}" style="width:100%; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.6);" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'">
            </div>
            <div class="modal-info wishlist-specs">
                <h2 style="margin-top:0; color:white; margin-bottom: 5px;">${card.name || 'Sin nombre'} (${card.code || '--'})</h2>
                ${modalBadgesHTML}
                <div class="info-grid" style="margin: 10px 0 20px 0;">${infoHtml}</div>
                <div class="specs-details">
                    <h3>Especificaciones:</h3>
                    <ul>
                        <li><strong>Estado:</strong> ${conditionVal}</li>
                        <li><strong>Idiomas:</strong> ${languageVal}</li>
                        <li><strong>Precio:</strong> <span class="price-tag">${priceVal}</span></li>
                    </ul>
                </div>
                ${cmButtonHtml}
            </div>
        `;
    } else if (tieneNoTrade) {
        const typeVal = card.type || variant.type || '--';
        const formatVal = card.format || variant.format || '--';
        const priceVal = card.price || variant.price || '--';

        const hasLink = card['cardmarket-link'] || variant['cardmarket-link'];
        const linkUrl = hasLink ? (card['cardmarket-link'] || variant['cardmarket-link']).trim() : '';
        const cmButtonHtml = linkUrl
            ? `<a href="${linkUrl}" target="_blank" class="cardmarket-btn" style="margin-top:15px;">Ver en Cardmarket</a>`
            : '';

        modalBody.innerHTML = `
            <div class="modal-img">
                <img src="${card.image || ''}" style="width:100%; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.6);" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'">
            </div>
            <div class="modal-info wishlist-specs">
                <h2 style="margin-top:0; color:white; margin-bottom: 5px;">${card.name || 'Sin nombre'} (${card.code || '--'})</h2>
                ${modalBadgesHTML}
                <div class="info-grid" style="margin: 10px 0 20px 0;">${infoHtml}</div>
                <div class="specs-details">
                    <h3>Especificaciones:</h3>
                    <ul>
                        <li><strong>Tipo:</strong> ${typeVal}</li>
                        <li><strong>Regulación:</strong> ${formatVal}</li>
                        <li><strong>Precio de mercado:</strong> <span class="price-tag">${priceVal}</span></li>
                    </ul>
                </div>
                ${cmButtonHtml}
            </div>
        `;
    } else {
        const variantsList = (visibleVariants.length > 0)
            ? visibleVariants
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
                ? `<a href="${v['cardmarket-link'].trim()}" target="_blank" class="cm-table-btn" title="Ver precio en Cardmarket">Ver</a>`
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

        modalBody.innerHTML = `
            <div class="modal-img">
                <img src="${card.image || ''}" style="width:100%; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.6);" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'">
            </div>
            <div class="modal-info">
                <h2 style="margin-top:0; color:white; margin-bottom: 5px;">${card.name || 'Sin nombre'} (${card.code || '--'})</h2>
                ${modalBadgesHTML}
                <div class="info-grid" style="margin: 10px 0;">${infoHtml}</div>
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
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                </div>
                <button id="btn-disponibles" class="btn-disponibles">Ver disponibles (${variantsList.length})</button>
            </div>
        `;

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

    openModal(modal);
}

function resetUrlToBinderOnly() {
    const binderId = getCurrentBinderId();
    const newParams = new URLSearchParams();
    newParams.set('b', binderId);
    window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
}

function syncSearchUrlParams(selectedExpansions, selectedLanguages, selectedConditions, selectedTypes) {
    const binderId = getCurrentBinderId();
    const newParams = new URLSearchParams();

    newParams.set('b', binderId);
    newParams.set('s', '1');

    const name = document.getElementById('search-query')?.value.trim();
    const code = document.getElementById('filter-code')?.value.trim();
    const reg = document.getElementById('filter-format')?.value.trim();
    const price = document.getElementById('filter-price')?.value.trim();
    const stock = document.getElementById('filter-stock')?.value.trim();

    const noTrade = document.getElementById('filter-notrade')?.checked;
    const reserved = document.getElementById('filter-reserved')?.checked;
    const sold = document.getElementById('filter-sold')?.checked;
    const traded = document.getElementById('filter-traded')?.checked;
    const unavailable = document.getElementById('filter-unavailable')?.checked;

    if (name) newParams.set('name', name);
    if (code) newParams.set('code', code);
    if (reg) newParams.set('reg', reg);
    if (price) newParams.set('price', price);
    if (stock) newParams.set('stock', stock);

    if (noTrade) newParams.set('noTrade', 'true');
    if (reserved) newParams.set('reserved', 'true');
    if (sold) newParams.set('sold', 'true');
    if (traded) newParams.set('traded', 'true');
    if (unavailable) newParams.set('unavailable', 'true');

    if (selectedExpansions && selectedExpansions.length > 0) {
        newParams.set('expansion', selectedExpansions.join(','));
    }

    if (selectedLanguages && selectedLanguages.length > 0) {
        newParams.set('lang', selectedLanguages.join(','));
    }

    if (selectedConditions && selectedConditions.length > 0) {
        newParams.set('condition', selectedConditions.join(','));
    }

    if (selectedTypes && selectedTypes.length > 0) {
        newParams.set('type', selectedTypes.join(','));
    }

    const newUrlString = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, '', newUrlString);
}

function restoreSearchFromUrlParams(selectedExpansions, selectedLanguages, selectedConditions, selectedTypes) {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('s')) return false;

    const nameParam = urlParams.get('name');
    const codeParam = urlParams.get('code');
    const regParam = urlParams.get('reg') || urlParams.get('format');
    const priceParam = urlParams.get('price');
    const stockParam = urlParams.get('stock');

    if (nameParam) document.getElementById('search-query').value = nameParam;
    if (codeParam) document.getElementById('filter-code').value = codeParam;
    if (regParam) document.getElementById('filter-format').value = regParam;
    if (priceParam) document.getElementById('filter-price').value = priceParam;
    if (stockParam) document.getElementById('filter-stock').value = stockParam;

    if (urlParams.get('noTrade') === 'true') document.getElementById('filter-notrade').checked = true;
    if (urlParams.get('reserved') === 'true') document.getElementById('filter-reserved').checked = true;
    if (urlParams.get('sold') === 'true') document.getElementById('filter-sold').checked = true;
    if (urlParams.get('traded') === 'true') document.getElementById('filter-traded').checked = true;
    if (urlParams.get('unavailable') === 'true') document.getElementById('filter-unavailable').checked = true;

    const expParam = urlParams.get('expansion');
    if (expParam) {
        selectedExpansions.length = 0;
        expParam.split(',').forEach(exp => selectedExpansions.push(exp));
        renderTags(document.getElementById('expansion-tags'), selectedExpansions);
    }

    const langParam = urlParams.get('lang');
    if (langParam) {
        selectedLanguages.length = 0;
        langParam.split(',').forEach(l => selectedLanguages.push(l));
        renderTags(document.getElementById('language-tags'), selectedLanguages);
    }

    const condParam = urlParams.get('condition');
    if (condParam) {
        selectedConditions.length = 0;
        condParam.split(',').forEach(c => selectedConditions.push(c));
        renderTags(document.getElementById('condition-tags'), selectedConditions);
    }

    const typeParam = urlParams.get('type');
    if (typeParam) {
        selectedTypes.length = 0;
        typeParam.split(',').forEach(t => selectedTypes.push(t));
        renderTags(document.getElementById('type-tags'), selectedTypes);
    }

    return true;
}

function renderTags(container, storageArray) {
    if (!container) return;
    container.innerHTML = '';

    storageArray.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'filter-tag';
        tag.innerHTML = `${item} <span class="remove-tag">&times;</span>`;
        tag.querySelector('.remove-tag').addEventListener('click', () => {
            const idx = storageArray.indexOf(item);
            if (idx > -1) storageArray.splice(idx, 1);
            renderTags(container, storageArray);
        });
        container.appendChild(tag);
    });
}

function openGenericSelectorModal(mode = 'expansion', target = 'main') {
    activeSelectorTarget = mode;
    activeExpansionTarget = target;

    const modal = document.getElementById('generic-selector-modal');
    if (!modal) return;

    const titleMap = {
        'expansion': 'Seleccionar expansiones:',
        'language': 'Seleccionar idiomas:',
        'condition': 'Seleccionar estados:',
        'type': 'Seleccionar tipo y rareza:',
        'album': 'Seleccionar álbum:'
    };

    const titleEl = document.getElementById('generic-modal-title');
    if (titleEl) titleEl.textContent = titleMap[mode] || 'Seleccionar:';

    const searchInput = document.getElementById('generic-search-input');
    if (searchInput) searchInput.value = '';

    currentActiveSetIndex = 0;
    currentActiveSeriesIndex = 0;

    renderGenericSelectorContent('');
    openModal(modal);
}

function createOptionCard(item, targetStorage, tagsContainerId) {
    const itemName = typeof item === 'string' ? item : item.name;
    const itemImg = typeof item === 'object' ? (item.flag || item.image || '') : '';
    const isSelected = targetStorage.includes(itemName);

    const card = document.createElement('div');
    card.className = `expansion-grid-card ${isSelected ? 'selected' : ''}`;
    card.style.cssText = `
        background: #161b22;
        border: 2px solid ${isSelected ? '#2ea043' : '#30363d'};
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
    `;

    let imgHtml = '';
    if (itemImg) {
        imgHtml = `<img src="${itemImg}" alt="${itemName}" style="width: 36px; height: 26px; object-fit: contain; border-radius: 3px;">`;
    } else {
        imgHtml = `<div class="empty-item-img-placeholder" style="width: 36px; height: 26px; border: 1px dashed #30363d; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: #484f58; font-size: 10px;">IMG</div>`;
    }

    card.innerHTML = `
        ${imgHtml}
        <span style="font-size: 12px; color: ${isSelected ? '#3fb950' : '#c9d1d9'}; font-weight: ${isSelected ? 'bold' : 'normal'};">${itemName}</span>
    `;

    card.addEventListener('click', () => {
        const idx = targetStorage.indexOf(itemName);
        if (idx > -1) {
            targetStorage.splice(idx, 1);
        } else {
            targetStorage.push(itemName);
        }
        renderTags(document.getElementById(tagsContainerId), targetStorage);
        renderGenericSelectorContent(document.getElementById('generic-search-input').value.toLowerCase());
    });

    return card;
}

function renderGenericSelectorContent(filterText = '') {
    const setTabsContainer = document.getElementById('set-tabs-container');
    const seriesSelectWrapper = document.getElementById('series-select-wrapper');
    const seriesDropdown = document.getElementById('series-dropdown-select');
    const gridContainer = document.getElementById('generic-grid-container');
    const confirmBtn = document.getElementById('confirm-generic-selection');

    if (!setTabsContainer || !seriesSelectWrapper || !seriesDropdown || !gridContainer || !confirmBtn) return;

    if (activeSelectorTarget !== 'expansion') {
        setTabsContainer.style.display = 'none';
        seriesSelectWrapper.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';

        gridContainer.innerHTML = '';

        if (activeSelectorTarget === 'album') {
            const albumSelect = document.getElementById('album-select');
            if (!albumSelect) return;

            const isEditorPage = !!document.getElementById('mode-selector');

            const visibleAlbums = allAlbumsMasterData.filter(album => {
                const opt = Array.from(albumSelect.options).find(o => o.getAttribute('data-id') === album.id);
                if (!opt) return false;

                const isHidden = opt.hasAttribute('hidden');
                const name = album.name;
                const dataId = album.id;

                if (isEditorPage || !isHidden) {
                    return name.toLowerCase().includes(filterText) || dataId.toLowerCase().includes(filterText);
                } else {
                    return filterText !== '' && (name.toLowerCase().includes(filterText) || dataId.toLowerCase().includes(filterText));
                }
            });

            if (visibleAlbums.length === 0) {
                gridContainer.innerHTML = `<div style="color: #8b949e; grid-column: 1 / -1; text-align: center; padding: 20px;">No se encontraron álbumes.</div>`;
                return;
            }

            gridContainer.style.gridTemplateColumns = '1fr';

            visibleAlbums.forEach(album => {
                const matchingOption = Array.from(albumSelect.options).find(opt => opt.getAttribute('data-id') === album.id);
                if (!matchingOption) return;

                const isSelected = albumSelect.value === matchingOption.value;
                const albumName = album.name;
                const albumImg = album.image || '';
                const albumDesc = album.description || 'Sin descripción disponible.';

                const card = document.createElement('div');
                card.className = `expansion-grid-card ${isSelected ? 'selected' : ''}`;
                card.style.cssText = `
                    background: #161b22;
                    border: 2px solid ${isSelected ? '#2ea043' : '#30363d'};
                    border-radius: 8px;
                    padding: 12px 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    transition: all 0.2s;
                `;

                let visualHtml = '';
                if (albumImg) {
                    visualHtml = `<img src="${albumImg}" alt="${albumName}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px; flex-shrink: 0;">`;
                } else {
                    visualHtml = `<div style="font-size: 28px; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">📖</div>`;
                }

                card.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0;">
                        <span style="font-size: 14px; color: ${isSelected ? '#3fb950' : '#c9d1d9'}; font-weight: bold;">${albumName}</span>
                        <span style="font-size: 12px; color: #8b949e; line-height: 1.4;">${albumDesc}</span>
                    </div>
                    ${visualHtml}
                `;

                card.addEventListener('click', () => {
                    albumSelect.value = matchingOption.value;

                    const labelSpan = document.getElementById('album-selected-name');
                    if (labelSpan) labelSpan.textContent = albumName;

                    albumSelect.dispatchEvent(new Event('change'));
                    closeModal(document.getElementById('generic-selector-modal'));
                });

                gridContainer.appendChild(card);
            });

            return;
        }

        let sourceArray = [];
        let targetStorage = [];
        let tagsContainerId = '';

        if (activeSelectorTarget === 'language') {
            sourceArray = allLanguagesMasterData;
            targetStorage = selectedLanguages;
            tagsContainerId = 'language-tags';
        } else if (activeSelectorTarget === 'condition') {
            sourceArray = allConditionsMasterData;
            targetStorage = selectedConditions;
            tagsContainerId = 'condition-tags';
        } else if (activeSelectorTarget === 'type') {
            sourceArray = allTypesMasterData;
            targetStorage = selectedTypes;
            tagsContainerId = 'type-tags';
        }

        const filtered = sourceArray.filter(item => {
            const name = typeof item === 'string' ? item : item.name;
            return name.toLowerCase().includes(filterText);
        });

        if (filtered.length === 0) {
            gridContainer.innerHTML = `<div style="color: #8b949e; grid-column: 1 / -1; text-align: center; padding: 20px;">No se encontraron resultados.</div>`;
            return;
        }

        filtered.forEach(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            const itemImg = typeof item === 'object' ? (item.flag || item.image || '') : '';

            let isSelected = false;
            if (activeExpansionTarget === 'variant_select') {
                if (activeSelectorTarget === 'language' && window._activeVariantSelectLang) {
                    isSelected = window._activeVariantSelectLang.value === itemName;
                } else if (activeSelectorTarget === 'condition' && window._activeVariantSelectCond) {
                    isSelected = window._activeVariantSelectCond.value === itemName;
                }
            } else {
                isSelected = targetStorage.includes(itemName);
            }

            const card = document.createElement('div');
            card.className = `expansion-grid-card ${isSelected ? 'selected' : ''}`;
            card.style.cssText = `
                background: #161b22;
                border: 2px solid ${isSelected ? '#2ea043' : '#30363d'};
                border-radius: 8px;
                padding: 10px;
                text-align: center;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s;
            `;

            let imgHtml = '';
            if (itemImg) {
                imgHtml = `<img src="${itemImg}" alt="${itemName}" style="width: 36px; height: 26px; object-fit: contain; border-radius: 3px;">`;
            } else {
                imgHtml = `<div class="empty-item-img-placeholder" style="width: 36px; height: 26px; border: 1px dashed #30363d; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: #484f58; font-size: 10px;">IMG</div>`;
            }

            card.innerHTML = `
                ${imgHtml}
                <span style="font-size: 12px; color: ${isSelected ? '#3fb950' : '#c9d1d9'}; font-weight: ${isSelected ? 'bold' : 'normal'};">${itemName}</span>
            `;

            card.addEventListener('click', () => {
                if (activeExpansionTarget === 'variant_select') {
                    if (activeSelectorTarget === 'language' && window._activeVariantSelectLang) {
                        const targetSelect = window._activeVariantSelectLang;
                        let optionExists = Array.from(targetSelect.options).some(o => o.value === itemName);
                        if (!optionExists) {
                            const opt = document.createElement('option');
                            opt.value = itemName;
                            opt.textContent = itemName;
                            targetSelect.appendChild(opt);
                        }
                        targetSelect.value = itemName;
                        targetSelect.dispatchEvent(new Event('change'));
                    } else if (activeSelectorTarget === 'condition' && window._activeVariantSelectCond) {
                        const targetSelect = window._activeVariantSelectCond;
                        let optionExists = Array.from(targetSelect.options).some(o => o.value === itemName);
                        if (!optionExists) {
                            const opt = document.createElement('option');
                            opt.value = itemName;
                            opt.textContent = itemName;
                            targetSelect.appendChild(opt);
                        }
                        targetSelect.value = itemName;
                        targetSelect.dispatchEvent(new Event('change'));
                    }
                    closeModal(document.getElementById('generic-selector-modal'));
                } else {
                    const idx = targetStorage.indexOf(itemName);
                    if (idx > -1) {
                        targetStorage.splice(idx, 1);
                    } else {
                        targetStorage.push(itemName);
                    }
                    renderTags(document.getElementById(tagsContainerId), targetStorage);
                    renderGenericSelectorContent(document.getElementById('generic-search-input').value.toLowerCase());
                }
            });

            gridContainer.appendChild(card);
        });

        return;
    }

    const targetArray = 
        (activeExpansionTarget === 'editor' && typeof editorSelectedExpansions !== 'undefined') ? editorSelectedExpansions :
        (activeExpansionTarget === 'shopping' && typeof activeShoppingExpansionTarget !== 'undefined' && activeShoppingExpansionTarget._cardExpansions) ? activeShoppingExpansionTarget._cardExpansions :
        selectedExpansions;

    function handleSelectionChange() {
        if (activeExpansionTarget === 'editor' && typeof renderEditorExpansionTags === 'function') {
            renderEditorExpansionTags();
        } else if (activeExpansionTarget === 'shopping' && typeof activeShoppingExpansionTarget !== 'undefined') {
            const tagsContainer = activeShoppingExpansionTarget.querySelector('.shop-edit-expansion-tags');
            if (typeof renderShopCardExpansionTags === 'function') {
                renderShopCardExpansionTags(tagsContainer, activeShoppingExpansionTarget._cardExpansions);
            }
        } else {
            renderTags(document.getElementById('expansion-tags'), selectedExpansions);
        }
    }

    if (filterText) {
        setTabsContainer.style.display = 'none';
        seriesSelectWrapper.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';

        gridContainer.innerHTML = '';
        let foundAny = false;

        allExpansionsMasterData.forEach(setObj => {
            if (setObj.series && Array.isArray(setObj.series)) {
                setObj.series.forEach(seriesObj => {
                    if (seriesObj.options && Array.isArray(seriesObj.options)) {
                        seriesObj.options.forEach(opt => {
                            const expName = typeof opt === 'string' ? opt : opt.name;
                            const expImg = typeof opt === 'string' ? 'https://images.pokemontcg.io/base1/symbol.png' : (opt.image || 'https://images.pokemontcg.io/base1/symbol.png');

                            if (expName.toLowerCase().includes(filterText)) {
                                foundAny = true;
                                const isSelected = targetArray.includes(expName);

                                const card = document.createElement('div');
                                card.className = `expansion-grid-card ${isSelected ? 'selected' : ''}`;
                                card.style.cssText = `
                                    background: #161b22;
                                    border: 2px solid ${isSelected ? '#2ea043' : '#30363d'};
                                    border-radius: 8px;
                                    padding: 10px;
                                    text-align: center;
                                    cursor: pointer;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: space-between;
                                    gap: 8px;
                                    transition: all 0.2s;
                                `;

                                card.innerHTML = `
                                    <img src="${expImg}" alt="${expName}" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'">
                                    <span style="font-size: 12px; color: ${isSelected ? '#3fb950' : '#c9d1d9'}; font-weight: ${isSelected ? 'bold' : 'normal'};">${expName}</span>
                                `;

                                card.addEventListener('click', () => {
                                    const idx = targetArray.indexOf(expName);
                                    if (idx > -1) {
                                        targetArray.splice(idx, 1);
                                    } else {
                                        targetArray.push(expName);
                                    }
                                    handleSelectionChange();
                                    renderGenericSelectorContent(document.getElementById('generic-search-input').value.toLowerCase());
                                });

                                gridContainer.appendChild(card);
                            }
                        });
                    }
                });
            }
        });

        if (!foundAny) {
            gridContainer.innerHTML = `<div style="color: #8b949e; grid-column: 1 / -1; text-align: center; padding: 20px;">No se encontraron expansiones.</div>`;
        }
        return;
    }

    setTabsContainer.style.display = 'flex';
    setTabsContainer.innerHTML = '';

    allExpansionsMasterData.forEach((setObj, sIdx) => {
        const isActive = sIdx === currentActiveSetIndex;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isActive ? 'btn-editor-primary' : 'editor-input';
        btn.style.cssText = `cursor: pointer; padding: 6px 14px; font-weight: bold; border-radius: 6px; ${isActive ? 'background: #2ea043; border-color: #2ea043;' : 'background: #161b22; color: #8b949e;'}`;
        btn.textContent = setObj.set;

        btn.addEventListener('click', () => {
            currentActiveSetIndex = sIdx;
            currentActiveSeriesIndex = 0;
            renderGenericSelectorContent('');
        });
        setTabsContainer.appendChild(btn);
    });

    const activeSet = allExpansionsMasterData[currentActiveSetIndex];
    const hasAnySeries = activeSet && activeSet.series && activeSet.series.length > 0;

    if (!hasAnySeries) {
        seriesSelectWrapper.style.display = 'none';
        gridContainer.innerHTML = `<div style="color: #8b949e; grid-column: 1 / -1; text-align: center; padding: 30px; font-size: 14px;">Este set no tiene expansiones.</div>`;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
        confirmBtn.style.cursor = 'not-allowed';
        return;
    }

    seriesSelectWrapper.style.display = 'flex';
    seriesDropdown.innerHTML = '';
    activeSet.series.forEach((seriesObj, serIdx) => {
        const option = document.createElement('option');
        option.value = serIdx;
        option.textContent = seriesObj.name;
        if (serIdx === currentActiveSeriesIndex) {
            option.selected = true;
        }
        seriesDropdown.appendChild(option);
    });

    gridContainer.innerHTML = '';
    const activeSeries = activeSet.series[currentActiveSeriesIndex];
    const hasExpansions = activeSeries && activeSeries.options && activeSeries.options.length > 0;

    if (!hasExpansions) {
        gridContainer.innerHTML = `<div style="color: #8b949e; grid-column: 1 / -1; text-align: center; padding: 30px; font-size: 14px;">Este set no tiene expansiones.</div>`;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
        confirmBtn.style.cursor = 'not-allowed';
        return;
    }

    confirmBtn.disabled = false;
    confirmBtn.style.opacity = '1';
    confirmBtn.style.cursor = 'pointer';

    activeSeries.options.forEach(opt => {
        const expName = typeof opt === 'string' ? opt : opt.name;
        const expImg = typeof opt === 'string' ? 'https://images.pokemontcg.io/base1/symbol.png' : (opt.image || 'https://images.pokemontcg.io/base1/symbol.png');
        const isSelected = targetArray.includes(expName);

        const card = document.createElement('div');
        card.className = `expansion-grid-card ${isSelected ? 'selected' : ''}`;
        card.style.cssText = `
            background: #161b22;
            border: 2px solid ${isSelected ? '#2ea043' : '#30363d'};
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            transition: all 0.2s;
        `;

        card.innerHTML = `
            <img src="${expImg}" alt="${expName}" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'">
            <span style="font-size: 12px; color: ${isSelected ? '#3fb950' : '#c9d1d9'}; font-weight: ${isSelected ? 'bold' : 'normal'};">${expName}</span>
        `;

        card.addEventListener('click', () => {
            if (activeExpansionTarget === 'shopping' && typeof activeShoppingExpansionTarget !== 'undefined' && activeShoppingExpansionTarget) {
                activeShoppingExpansionTarget._cardExpansion = expName;
                if (typeof renderShopCardSingleExpansionTag === 'function') {
                    renderShopCardSingleExpansionTag(
                        activeShoppingExpansionTarget.querySelector('.shop-edit-expansion-tags'), 
                        activeShoppingExpansionTarget
                    );
                }
                closeModal(document.getElementById('generic-selector-modal'));
            } else {
                const idx = targetArray.indexOf(expName);
                if (idx > -1) {
                    targetArray.splice(idx, 1);
                } else {
                    targetArray.push(expName);
                }
                handleSelectionChange();
                renderGenericSelectorContent('');
            }
        });

        gridContainer.appendChild(card);
    });
}

function openExpansionSelectorModal(target = 'main') {
    openGenericSelectorModal('expansion', target);
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadFilterMasterData();

    const albumSelect = document.getElementById('album-select');
    const viewModeSelect = document.getElementById('view-mode-select');

    let isInitialLoad = true;

    const urlParams = new URLSearchParams(window.location.search);
    let binderParam = urlParams.get('b');

    if (!binderParam && albumSelect && albumSelect.options.length > 0) {
        const options = Array.from(albumSelect.options).filter(opt => !opt.hasAttribute('hidden'));
        if (options.length > 0) {
            const randomIndex = Math.floor(Math.random() * options.length);
            binderParam = options[randomIndex].getAttribute('data-id');
        } else {
            binderParam = albumSelect.options[0].getAttribute('data-id') || 'gamegenic';
        }

        const defaultParams = new URLSearchParams(window.location.search);
        defaultParams.set('b', binderParam);
        window.history.replaceState({}, '', `${window.location.pathname}?${defaultParams.toString()}`);
    }

    /*if (!binderParam && albumSelect) {
        binderParam = albumSelect.options[0].getAttribute('data-id') || 'gamegenic';
        const defaultParams = new URLSearchParams();
        defaultParams.set('b', binderParam);
        window.history.replaceState({}, '', `${window.location.pathname}?${defaultParams.toString()}`);
    }*/

    if (binderParam && albumSelect) {
        const matchingOption = Array.from(albumSelect.options).find(
            opt => opt.getAttribute('data-id') === binderParam
        );

        if (matchingOption) {
            albumSelect.value = matchingOption.value;
        }
    }

    async function handleAlbumChange() {
        if (albumSelect) {
            jsonFile = albumSelect.value;
            const selectedOption = albumSelect.options[albumSelect.selectedIndex];

            const labelSpan = document.getElementById('album-selected-name');
            if (labelSpan && selectedOption) {
                labelSpan.textContent = selectedOption.textContent;
            }

            gridType = selectedOption.getAttribute('data-grid') || '2x2';

            if (!isInitialLoad) {
                const binderId = selectedOption.getAttribute('data-id');
                if (binderId) {
                    resetUrlToBinderOnly();
                }
            }

            currentPage = 1;

            if (isInitialLoad) {
                await loadAllBinders();

                const currentUrlParams = new URLSearchParams(window.location.search);

                if (currentUrlParams.has('c')) {
                    const targetPage = parseInt(currentUrlParams.get('page'), 10) || 1;
                    const targetSlot = parseInt(currentUrlParams.get('slot'), 10) || 1;

                    goToPage(targetPage);

                    const pageData = allPagesData.find(p => p.number === targetPage);
                    if (pageData && pageData.cards) {
                        const targetCard = pageData.cards.find(c => parseInt(c.slot, 10) === targetSlot);
                        if (targetCard) {
                            showDetails(targetCard, targetPage, targetSlot);
                        }
                    }
                }
                else if (currentUrlParams.has('s')) {
                    restoreSearchFromUrlParams(selectedExpansions, selectedLanguages, selectedConditions, selectedTypes);
                    const searchModal = document.getElementById('search-modal');
                    if (searchModal) {
                        openModal(searchModal);
                    }
                }

                return;
            }

            isAnimating = true;
            toggleControlsDisabled(true);

            const bookContainer = document.getElementById('binder-book');
            if (bookContainer) {
                bookContainer.style.transition = 'opacity 0.2s ease';
                bookContainer.style.opacity = '0';
            }

            setTimeout(async () => {
                await loadAllBinders();

                if (bookContainer) {
                    bookContainer.style.opacity = '1';
                }

                setTimeout(() => {
                    isAnimating = false;
                    toggleControlsDisabled(false);
                }, 200);

            }, 200);
        }
    }

    if (albumSelect) albumSelect.addEventListener('change', handleAlbumChange);
    if (viewModeSelect) viewModeSelect.addEventListener('change', renderCurrentView);

    window.addEventListener('resize', renderCurrentView);

    const closeBtn = document.querySelector('.close-btn');
    const cardModal = document.getElementById('card-modal');
    if (closeBtn && cardModal) {
        closeBtn.addEventListener('click', () => {
            resetUrlToBinderOnly();
            closeModal(cardModal);
        });
    }

    document.addEventListener('click', (e) => {
        const backdrop = document.getElementById('modal-backdrop');
        if (e.target === backdrop) {
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) {
                if (activeModal.id === 'search-modal' || activeModal.id === 'card-modal') {
                    resetUrlToBinderOnly();
                }
                closeModal(activeModal);
            }
        }
    });

    const pageInput = document.getElementById('page-input');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn?.addEventListener('click', () => {
        const mode = getCurrentMode();
        if (mode === 'single') {
            goToPage(currentPage - 1);
        } else {
            if (currentPage === 1) return;
            let left = currentPage % 2 === 0 ? currentPage : currentPage - 1;
            goToPage(left - 1);
        }
    });

    nextBtn?.addEventListener('click', () => {
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

    pageInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            goToPage(e.target.value);
            e.target.blur();
        }
    });

    pageInput?.addEventListener('blur', () => {
        renderCurrentView();
    });

    const searchModal = document.getElementById('search-modal');
    const resultsModal = document.getElementById('results-modal');
    const genericModal = document.getElementById('generic-selector-modal');

    const openSearchBtns = document.querySelectorAll('#open-search-modal-btn, .open-search-btn');
    const closeSearchBtn = document.getElementById('close-search-modal');
    const closeResultsBtn = document.getElementById('close-results-modal');

    const closeGenericBtn = document.getElementById('close-generic-modal');
    const confirmGenericBtn = document.getElementById('confirm-generic-selection');

    openSearchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            syncSearchUrlParams(selectedExpansions, selectedLanguages, selectedConditions, selectedTypes);
            openModal(searchModal);
        });
    });

    document.getElementById('open-album-modal-btn')?.addEventListener('click', () => {
        openGenericSelectorModal('album');
    });

    document.getElementById('open-expansion-modal-btn')?.addEventListener('click', () => {
        openGenericSelectorModal('expansion');
    });

    document.getElementById('open-language-modal-btn')?.addEventListener('click', () => {
        openGenericSelectorModal('language');
    });

    document.getElementById('open-condition-modal-btn')?.addEventListener('click', () => {
        openGenericSelectorModal('condition');
    });

    document.getElementById('open-type-modal-btn')?.addEventListener('click', () => {
        openGenericSelectorModal('type');
    });

    if (closeSearchBtn && searchModal) {
        closeSearchBtn.addEventListener('click', () => {
            resetUrlToBinderOnly();
            closeModal(searchModal);
        });
    }

    if (closeResultsBtn && resultsModal) {
        closeResultsBtn.addEventListener('click', () => {
            closeModal(resultsModal);
        });
    }

    if (closeGenericBtn && genericModal) {
        closeGenericBtn.addEventListener('click', () => {
            closeModal(genericModal);
        });
    }

    if (confirmGenericBtn && genericModal) {
        confirmGenericBtn.addEventListener('click', () => {
            closeModal(genericModal);
        });
    }

    document.getElementById('generic-search-input')?.addEventListener('input', (e) => {
        renderGenericSelectorContent(e.target.value.toLowerCase());
    });

    document.getElementById('series-dropdown-select')?.addEventListener('change', (e) => {
        currentActiveSeriesIndex = parseInt(e.target.value, 10);
        renderGenericSelectorContent('');
    });

    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
        document.getElementById('search-query').value = '';
        document.getElementById('filter-code').value = '';
        document.getElementById('filter-format').value = '';
        document.getElementById('filter-price').value = '';
        document.getElementById('filter-stock').value = '';

        document.getElementById('filter-notrade').checked = false;
        document.getElementById('filter-reserved').checked = false;
        document.getElementById('filter-sold').checked = false;
        document.getElementById('filter-traded').checked = false;
        document.getElementById('filter-unavailable').checked = false;

        selectedExpansions.length = 0;
        selectedLanguages.length = 0;
        selectedConditions.length = 0;
        selectedTypes.length = 0;

        renderTags(document.getElementById('expansion-tags'), selectedExpansions);
        renderTags(document.getElementById('language-tags'), selectedLanguages);
        renderTags(document.getElementById('condition-tags'), selectedConditions);
        renderTags(document.getElementById('type-tags'), selectedTypes);

        resetUrlToBinderOnly();
    });

    document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
        const queryInput = document.getElementById('search-query');
        const query = queryInput.value.toLowerCase().trim();

        const codeVal = document.getElementById('filter-code').value.toLowerCase().trim();
        const formatVal = document.getElementById('filter-format').value.toLowerCase().trim();
        const maxPrice = parseFloat(document.getElementById('filter-price').value);
        const minStock = parseInt(document.getElementById('filter-stock').value, 10);

        const isNoTrade = document.getElementById('filter-notrade').checked;
        const isReserved = document.getElementById('filter-reserved').checked;
        const isSold = document.getElementById('filter-sold').checked;
        const isTraded = document.getElementById('filter-traded').checked;
        const isUnavailable = document.getElementById('filter-unavailable').checked;

        const hasInteraction = query !== '' ||
            codeVal !== '' ||
            formatVal !== '' ||
            !isNaN(maxPrice) ||
            !isNaN(minStock) ||
            isNoTrade || isReserved || isSold || isTraded || isUnavailable ||
            selectedExpansions.length > 0 ||
            selectedLanguages.length > 0 ||
            selectedConditions.length > 0 ||
            selectedTypes.length > 0;

        if (!hasInteraction) {
            alert("Para usar la búsqueda avanzada, debes seleccionar al menos uno de los filtros.");
            return;
        }

        syncSearchUrlParams(selectedExpansions, selectedLanguages, selectedConditions, selectedTypes);

        const matches = [];
        const isEditorPage = !!document.getElementById('mode-selector');

        allPagesData.forEach(page => {
            if (!page.cards) return;

            page.cards.forEach(card => {
                const name = (card.name || '').toLowerCase();
                const code = (card.code || '').toLowerCase();

                if (query && !name.includes(query)) return;

                if (selectedExpansions.length > 0) {
                    let cardExpArray = [];
                    if (Array.isArray(card.expansion)) {
                        cardExpArray = card.expansion.map(e => e.toLowerCase().trim());
                    } else if (typeof card.expansion === 'string') {
                        cardExpArray = card.expansion.split(',').map(e => e.toLowerCase().trim());
                    }

                    const hasExpMatch = selectedExpansions.some(exp =>
                        cardExpArray.includes(exp.toLowerCase().trim())
                    );

                    if (!hasExpMatch) return;
                }

                if (codeVal && !code.includes(codeVal)) return;

                const hasNoTrade = card.noTrade === true ||
                    (card.price && card.price.toUpperCase().includes("NO TRADE")) ||
                    (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("NO TRADE")));

                const hasReserved = card.reservada === true ||
                    (card.price && card.price.toUpperCase().includes("RESERVADA")) ||
                    (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("RESERVADA")));

                const hasSold = card.vendida === true ||
                    (card.price && card.price.toUpperCase().includes("VENDIDA")) ||
                    (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("VENDIDA")));

                const hasTraded = card.traded === true ||
                    (card.price && card.price.toUpperCase().includes("TRADED")) ||
                    (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("TRADED")));

                const hasUnavailable = card.noDisponible === true ||
                    (card.price && card.price.toUpperCase().includes("NO DISPONIBLE")) ||
                    (card.variants && card.variants.some(v => v.price && v.price.toUpperCase().includes("NO DISPONIBLE")));

                if (isNoTrade && !hasNoTrade) return;
                if (isReserved && !hasReserved) return;
                if (isSold && !hasSold) return;
                if (isTraded && !hasTraded) return;
                if (isUnavailable && !hasUnavailable) return;

                let rawVariants = (card.variants && card.variants.length > 0) ? card.variants : [{
                    language: card.language,
                    type: card.type,
                    format: card.format,
                    condition: card.condition,
                    price: card.price,
                    stock: card.stock
                }];

                const variants = isEditorPage ? rawVariants : rawVariants.filter(v => !v.hidden);

                if (variants.length === 0) return;

                const matchVariant = variants.some(v => {
                    if (selectedLanguages.length > 0 && !selectedLanguages.includes(v.language)) return false;
                    if (selectedConditions.length > 0 && !selectedConditions.includes(v.condition)) return false;
                    if (formatVal && !(v.format || '').toLowerCase().includes(formatVal)) return false;

                    if (selectedTypes.length > 0) {
                        const cardType = v.type || '';
                        if (!selectedTypes.some(t => cardType.includes(t))) return false;
                    }

                    if (!isNaN(maxPrice)) {
                        const rawPrice = parseFloat((v.price || '').replace('€', '').replace(',', '.'));
                        if (isNaN(rawPrice) || rawPrice > maxPrice) return false;
                    }

                    if (!isNaN(minStock)) {
                        const stockVal = parseInt(v.stock || '0', 10);
                        if (stockVal < minStock) return false;
                    }

                    return true;
                });

                if (!matchVariant) return;

                matches.push({ page: page.number, slot: card.slot, cardData: card });
            });
        });

        lastSearchResults = matches;
        closeModal(searchModal);
        
        const sortSelect = document.getElementById('search-sort-select');
        if (sortSelect) sortSelect.value = 'page-asc';

        renderVisualResults(lastSearchResults);
        setTimeout(() => {
            openModal(resultsModal);
        }, 150);
    });

    const sortSelect = document.getElementById('search-sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortAndRenderResults(e.target.value);
        });
    }

    function parseCardPrice(cardData) {
        let rawStr = cardData.price || '';
        if (!rawStr && cardData.variants && cardData.variants.length > 0) {
            rawStr = cardData.variants[0].price || '';
        }
        if (!rawStr) return 0;
        const cleanStr = rawStr.replace('€', '').replace(',', '.').trim();
        const num = parseFloat(cleanStr);
        return isNaN(num) ? 0 : num;
    }

    function getCardExpansionName(cardData) {
        if (Array.isArray(cardData.expansion) && cardData.expansion.length > 0) {
            return cardData.expansion[0];
        }
        return cardData.expansion || '';
    }

    function getCardCode(cardData) {
        return (cardData.code || '').trim().toUpperCase();
    }

    function sortAndRenderResults(sortKey) {
        if (!lastSearchResults || lastSearchResults.length === 0) return;

        const sorted = [...lastSearchResults];

        sorted.sort((a, b) => {
            const cardA = a.cardData;
            const cardB = b.cardData;

            switch (sortKey) {
                case 'page-asc':
                    if (a.page !== b.page) return a.page - b.page;
                    return parseInt(a.slot, 10) - parseInt(b.slot, 10);

                case 'page-desc':
                    if (a.page !== b.page) return b.page - a.page;
                    return parseInt(b.slot, 10) - parseInt(a.slot, 10);

                case 'price-asc':
                    return parseCardPrice(cardA) - parseCardPrice(cardB);

                case 'price-desc':
                    return parseCardPrice(cardB) - parseCardPrice(cardA);

                case 'name-asc':
                    return (cardA.name || '').localeCompare(cardB.name || '');

                case 'name-desc':
                    return (cardB.name || '').localeCompare(cardA.name || '');

                case 'exp-desc': {
                    const expA = getCardExpansionName(cardA);
                    const expB = getCardExpansionName(cardB);
                    let idxA = expansionChronologicalOrder.indexOf(expA);
                    let idxB = expansionChronologicalOrder.indexOf(expB);
                    if (idxA === -1) idxA = 9999;
                    if (idxB === -1) idxB = 9999;

                    if (idxA !== idxB) {
                        return idxA - idxB;
                    }

                    const codeA = getCardCode(cardA);
                    const codeB = getCardCode(cardB);
                    return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
                }

                case 'exp-asc': {
                    const expA = getCardExpansionName(cardA);
                    const expB = getCardExpansionName(cardB);
                    let idxA = expansionChronologicalOrder.indexOf(expA);
                    let idxB = expansionChronologicalOrder.indexOf(expB);
                    if (idxA === -1) idxA = -1;
                    if (idxB === -1) idxB = -1;

                    if (idxA !== idxB) {
                        return idxB - idxA;
                    }

                    const codeA = getCardCode(cardA);
                    const codeB = getCardCode(cardB);
                    return codeB.localeCompare(codeA, undefined, { numeric: true, sensitivity: 'base' });
                }

                default:
                    return 0;
            }
        });

        renderVisualResults(sorted);
    }

    function renderVisualResults(results) {
        const grid = document.getElementById('search-results-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (results.length === 0) {
            grid.innerHTML = `<div style="color: #8b949e; grid-column: 1 / -1; padding: 20px; text-align: center;">No se encontraron cartas que coincidan.</div>`;
            return;
        }

        results.forEach(res => {
            const cardData = res.cardData;

            const tieneNoTrade = cardData.noTrade === true ||
                (cardData.price && cardData.price.toUpperCase().includes("NO TRADE")) ||
                (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("NO TRADE")));

            const tieneReservada = cardData.reservada === true ||
                (cardData.price && cardData.price.toUpperCase().includes("RESERVADA")) ||
                (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("RESERVADA")));

            const tieneVendida = cardData.vendida === true ||
                (cardData.price && cardData.price.toUpperCase().includes("VENDIDA")) ||
                (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("VENDIDA")));

            const tieneTraded = cardData.traded === true ||
                (cardData.price && cardData.price.toUpperCase().includes("TRADED")) ||
                (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("TRADED")));

            const tieneNoDisponible = cardData.noDisponible === true ||
                (cardData.price && cardData.price.toUpperCase().includes("NO DISPONIBLE")) ||
                (cardData.variants && cardData.variants.some(v => v.price && v.price.toUpperCase().includes("NO DISPONIBLE")));

            let badgesHTML = '';
            if (tieneNoTrade || tieneReservada || tieneVendida || tieneTraded || tieneNoDisponible) {
                badgesHTML += `<div class="badge-stack">`;
                if (tieneNoTrade) badgesHTML += `<div class="card-badge badge-notrade">NO TRADE</div>`;
                if (tieneReservada) badgesHTML += `<div class="card-badge badge-reserved">RESERVADA</div>`;
                if (tieneVendida) badgesHTML += `<div class="card-badge badge-sold">VENDIDA</div>`;
                if (tieneTraded) badgesHTML += `<div class="card-badge badge-traded">TRADED</div>`;
                if (tieneNoDisponible) badgesHTML += `<div class="card-badge badge-unavailable">NO DISPONIBLE</div>`;
                badgesHTML += `</div>`;
            }

            const cardBox = document.createElement('div');
            cardBox.className = 'search-result-card';
            cardBox.innerHTML = `
                ${badgesHTML}
                <img src="${cardData.image || ''}" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'">
                <div class="card-pos">Pág. ${res.page} - Slot ${res.slot}</div>
            `;

            cardBox.addEventListener('click', () => {
                closeModal(resultsModal);
                setTimeout(() => {
                    goToPage(res.page);
                    showDetails(cardData, res.page, res.slot);
                }, 150);
            });

            grid.appendChild(cardBox);
        });
    }

    const backToSearchBtn = document.getElementById('back-to-search-btn');

    if (backToSearchBtn && resultsModal && searchModal) {
        backToSearchBtn.addEventListener('click', () => {
            closeModal(resultsModal);
            setTimeout(() => {
                openModal(searchModal);
            }, 150);
        });
    }

    await handleAlbumChange();
    isInitialLoad = false;
});

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const binderBook = document.getElementById('binder-book');

if (binderBook) {
    binderBook.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    binderBook.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const minSwipeDistance = 50;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < -minSwipeDistance) {
            document.getElementById('next-btn')?.click();
        } else if (diffX > minSwipeDistance) {
            document.getElementById('prev-btn')?.click();
        }
    }
}

document.addEventListener('keydown', (e) => {
    const activeModal = document.querySelector('.modal-overlay.active');

    if (e.key === 'Escape' || e.key === 'Esc') {
        if (activeModal) {
            if (activeModal.id === 'search-modal' || activeModal.id === 'card-modal') {
                resetUrlToBinderOnly();
            }
            closeModal(activeModal);
            return;
        }
    }

    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }

    if (activeModal) {
        return;
    }

    if (e.key === 'ArrowLeft') {
        document.getElementById('prev-btn')?.click();
    } else if (e.key === 'ArrowRight') {
        document.getElementById('next-btn')?.click();
    }
});

async function loadFilterMasterData() {
    try {
        let response = await fetch('../mytcgb/json/mdata.json');
        if (!response.ok) {
            response = await fetch('/json/mdata.json');
        }

        if (!response.ok) {
            console.error('Error al cargar json/mdata.json:', response.statusText);
            return;
        }

        const mdata = await response.json();

        expansionChronologicalOrder = [];
        allAlbumsMasterData = mdata.albumes || [];
        allExpansionsMasterData = mdata.expansions || [];
        allLanguagesMasterData = mdata.idiomas || [];
        allConditionsMasterData = mdata.estados || [];
        allTypesMasterData = mdata.tipos_rareza || [];

        if (allExpansionsMasterData) {
            allExpansionsMasterData.forEach(setObj => {
                setObj.series.forEach(seriesObj => {
                    seriesObj.options.forEach(opt => {
                        const optName = typeof opt === 'string' ? opt : opt.name;
                        expansionChronologicalOrder.push(optName);
                    });
                });
            });
        }
    } catch (error) {
        console.error('Error al cargar mdata.json para la búsqueda avanzada:', error);
    }
}