function showDetails(card, pageNum) {
    const modal = document.getElementById('card-modal');
    const modalBody = document.getElementById('modal-body');

    let infoHtml = `<p><strong>Expansión:</strong> ${card.expansion || '--'} (${card.code || '--'})</p>`;

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
            
            <div class="info-grid" style="margin-bottom: 20px;">
                ${infoHtml}
            </div>
            
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
    
    modal.style.display = 'flex';
}
