let jsonFile = '';
let gridType = '2x2';

let allPagesData = [];
let currentPage = 1;

let isAnimating = false;

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

    const albumSelect = document.getElementById('album-select');
    const selectedOption = albumSelect ? albumSelect.options[albumSelect.selectedIndex] : null;
    const isWishlist = selectedOption && selectedOption.getAttribute('data-id') === 'wishlist';

    if (isWishlist) {
        const variant = (card.variants && card.variants.length > 0) ? card.variants[0] : {};
        const conditionVal = card.condition || variant.condition || '--';
        const languageVal = card.language || variant.language || '--';
        const priceVal = card.price || variant.price || '--';

        const hasLink = card['cardmarket-link'] || variant['cardmarket-link'];
        const linkUrl = hasLink ? (card['cardmarket-link'] || variant['cardmarket-link']).trim() : '';
        const cmButtonHtml = linkUrl
            ? `<a href="${linkUrl}" target="_blank" class="cardmarket-btn">Ver en Cardmarket</a>`
            : '';

        modalBody.innerHTML = `
            <div class="modal-img">
                <img src="${card.image || ''}" style="width:100%; border-radius:8px; box-shadow: 0 4px 15px rgba(0,0,0,0.6);" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'">
            </div>
            <div class="modal-info wishlist-specs">
                <h2 style="margin-top:0; color:white; margin-bottom: 15px;">${card.name || 'Sin nombre'}</h2>
                <div class="info-grid" style="margin-bottom: 20px;">${infoHtml}</div>
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
    } else {
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
                <h2 style="margin-top:0; color:white;">${card.name || 'Sin nombre'}</h2>
                <div class="info-grid">${infoHtml}</div>
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

document.addEventListener("DOMContentLoaded", () => {
    const albumSelect = document.getElementById('album-select');
    const viewModeSelect = document.getElementById('view-mode-select');

    let isInitialLoad = true;

    const urlParams = new URLSearchParams(window.location.search);
    const binderParam = urlParams.get('b');

    if (binderParam && albumSelect) {
        const matchingOption = Array.from(albumSelect.options).find(
            opt => opt.getAttribute('data-id') === binderParam
        );

        if (matchingOption) {
            albumSelect.value = matchingOption.value;
        }
    }

    function handleAlbumChange() {
        if (albumSelect) {
            jsonFile = albumSelect.value;
            const selectedOption = albumSelect.options[albumSelect.selectedIndex];
            gridType = selectedOption.getAttribute('data-grid') || '2x2';

            if (!isInitialLoad) {
                const binderId = selectedOption.getAttribute('data-id');
                if (binderId) {
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('b', binderId);
                    window.history.replaceState({}, '', newUrl);
                }
            }

            currentPage = 1;

            if (isInitialLoad) {
                loadAllBinders();
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

    handleAlbumChange();

    isInitialLoad = false;

    const closeBtn = document.querySelector('.close-btn');
    const cardModal = document.getElementById('card-modal');
    if (closeBtn && cardModal) {
        closeBtn.addEventListener('click', () => {
            closeModal(cardModal);
        });
    }

    document.addEventListener('click', (e) => {
        const backdrop = document.getElementById('modal-backdrop');
        if (e.target === backdrop) {
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) closeModal(activeModal);
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

    const openSearchBtns = document.querySelectorAll('#open-search-modal-btn, .open-search-btn');
    const closeSearchBtn = document.getElementById('close-search-modal');
    const closeResultsBtn = document.getElementById('close-results-modal');

    let selectedExpansions = [];
    let selectedLanguages = [];
    let selectedConditions = [];

    openSearchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            openModal(searchModal);
        });
    });

    if (closeSearchBtn && searchModal) {
        closeSearchBtn.addEventListener('click', () => {
            closeModal(searchModal);
        });
    }

    if (closeResultsBtn && resultsModal) {
        closeResultsBtn.addEventListener('click', () => {
            closeModal(resultsModal);
        });
    }

    function setupMultiSelect(selectId, tagsContainerId, storageArray) {
        const select = document.getElementById(selectId);
        const container = document.getElementById(tagsContainerId);
        if (!select || !container) return;

        select.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val && !storageArray.includes(val)) {
                storageArray.push(val);
                renderTags(container, storageArray);
            }
            select.selectedIndex = 0;
        });
    }

    function renderTags(container, storageArray) {
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

    setupMultiSelect('filter-expansion-select', 'expansion-tags', selectedExpansions);
    setupMultiSelect('filter-language-select', 'language-tags', selectedLanguages);
    setupMultiSelect('filter-condition-select', 'condition-tags', selectedConditions);

    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
        document.getElementById('search-query').value = '';
        document.getElementById('filter-code').value = '';
        document.getElementById('filter-format').value = '';
        document.getElementById('filter-price').value = '';
        document.getElementById('filter-stock').value = '';

        document.getElementById('filter-notrade').checked = false;
        document.getElementById('filter-reserved').checked = false;
        document.querySelectorAll('.filter-type').forEach(cb => cb.checked = false);

        selectedExpansions.length = 0;
        selectedLanguages.length = 0;
        selectedConditions.length = 0;

        renderTags(document.getElementById('expansion-tags'), selectedExpansions);
        renderTags(document.getElementById('language-tags'), selectedLanguages);
        renderTags(document.getElementById('condition-tags'), selectedConditions);
    });

    document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
        const queryInput = document.getElementById('search-query');
        const query = queryInput.value.toLowerCase().trim();

        if (!query) {
            alert("Para iniciar la búsqueda avanzada, debes introducir nombre o código de carta.");
            queryInput.focus();
            return;
        }

        const codeVal = document.getElementById('filter-code').value.toLowerCase().trim();
        const formatVal = document.getElementById('filter-format').value.toLowerCase().trim();
        const maxPrice = parseFloat(document.getElementById('filter-price').value);
        const minStock = parseInt(document.getElementById('filter-stock').value, 10);

        const isNoTrade = document.getElementById('filter-notrade').checked;
        const isReserved = document.getElementById('filter-reserved').checked;
        const selectedTypes = Array.from(document.querySelectorAll('.filter-type:checked')).map(cb => cb.value);

        const matches = [];

        allPagesData.forEach(page => {
            if (!page.cards) return;

            page.cards.forEach(card => {
                const name = (card.name || '').toLowerCase();
                const code = (card.code || '').toLowerCase();
                const expansion = card.expansion || '';

                if (!name.includes(query) && !code.includes(query)) return;

                if (selectedExpansions.length > 0 && !selectedExpansions.includes(expansion)) return;
                if (codeVal && !code.includes(codeVal)) return;

                const hasNoTrade = card.noTrade === true || (card.price && card.price.includes("NO TRADE"));
                const hasReserved = card.reservada === true || (card.price && card.price.includes("RESERVADA"));

                if (isNoTrade && !hasNoTrade) return;
                if (isReserved && !hasReserved) return;

                const variants = (card.variants && card.variants.length > 0) ? card.variants : [{
                    language: card.language,
                    type: card.type,
                    format: card.format,
                    condition: card.condition,
                    price: card.price,
                    stock: card.stock
                }];

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

        closeModal(searchModal);
        renderVisualResults(matches);
        setTimeout(() => {
            openModal(resultsModal);
        }, 150);
    });

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

            let badgesHTML = '';
            if (tieneNoTrade) badgesHTML += `<div class="no-trade-badge">NO TRADE</div>`;
            if (tieneReservada) badgesHTML += `<div class="reserved-badge">RESERVADA</div>`;

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
                    showDetails(cardData, res.page);
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
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
    }

    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
        return;
    }

    if (e.key === 'ArrowLeft') {
        document.getElementById('prev-btn')?.click();
    } else if (e.key === 'ArrowRight') {
        document.getElementById('next-btn')?.click();
    }
});
