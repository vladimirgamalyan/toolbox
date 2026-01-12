document.addEventListener('DOMContentLoaded', () => {
    const playerCountSelect = document.getElementById('player-count');
    const mapImage = document.getElementById('map-image');
    const highlightsContainer = document.getElementById('highlights-container');
    const infoPanel = document.getElementById('info-panel');
    
    let mapData = null;
    let currentCount = playerCountSelect.value;
    let hitboxCanvas = document.createElement('canvas');
    let hitboxCtx = hitboxCanvas.getContext('2d', { willReadFrequently: true });
    let hitboxImage = new Image();

    async function loadMapData(playerCount) {
        try {
            const response = await fetch(`./data/map/map${playerCount}p.json`);
            mapData = await response.json();
            
            hitboxImage.src = `./img/map/map${playerCount}p/hitbox.png`;
            hitboxImage.onload = () => {
                hitboxCanvas.width = hitboxImage.width;
                hitboxCanvas.height = hitboxImage.height;
                hitboxCtx.drawImage(hitboxImage, 0, 0);
                console.log(`Hitbox loaded for ${playerCount} players`);
            };
        } catch (error) {
            console.error('Ошибка при загрузке данных карты:', error);
            infoPanel.textContent = 'Ошибка загрузки данных карты';
        }
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    function clearHighlights() {
        highlightsContainer.innerHTML = '';
    }

    function addHighlight(regionId, type) {
        const img = document.createElement('img');
        img.src = `./img/map/map${currentCount}p/areas/${regionId}.png`;
        img.className = `highlight-img highlight-${type}`;
        highlightsContainer.appendChild(img);
    }

    function handleMapClick(event) {
        if (!mapData || !hitboxImage.complete) return;

        const rect = mapImage.getBoundingClientRect();
        
        // Координаты клика относительно элемента img
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Масштабируем координаты к реальному размеру изображения hitbox
        const scaleX = hitboxCanvas.width / rect.width;
        const scaleY = hitboxCanvas.height / rect.height;
        
        const canvasX = Math.floor(x * scaleX);
        const canvasY = Math.floor(y * scaleY);

        const pixelData = hitboxCtx.getImageData(canvasX, canvasY, 1, 1).data;
        const color = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);

        console.log(`Clicked color: ${color} at ${canvasX}, ${canvasY}`);

        if (color === '#000000') {
            infoPanel.textContent = 'Пустая область';
            clearHighlights();
            return;
        }

        let foundRegionId = null;
        for (const [id, data] of Object.entries(mapData)) {
            if (data.hitboxColor.toUpperCase() === color) {
                foundRegionId = id;
                break;
            }
        }

        if (foundRegionId) {
            const region = mapData[foundRegionId];
            infoPanel.innerHTML = `
                <div class="info-item"><strong>ID:</strong> ${foundRegionId}</div>
                <div class="info-item"><strong>Название:</strong> ${region.name}</div>
                <div class="info-item"><strong>Тип:</strong> ${region.type}</div>
                <div class="info-item"><strong>Соседние области:</strong> ${region.adjacent.join(', ')}</div>
                <div class="info-item"><strong>Обелиск:</strong> ${region.obelisk ? 'Да' : 'Нет'}</div>
            `;
            
            clearHighlights();
            
            // Сначала рисуем соседей (они будут снизу)
            if (region.adjacent && Array.isArray(region.adjacent)) {
                region.adjacent.forEach(adjId => {
                    if (mapData[adjId]) {
                        addHighlight(adjId, 'adjacent');
                    }
                });
            }

            // Затем рисуем выбранный регион (он будет сверху)
            addHighlight(foundRegionId, 'selected');
        } else {
            infoPanel.textContent = `Неизвестный регион (цвет: ${color})`;
            clearHighlights();
        }
    }

    playerCountSelect.addEventListener('change', (event) => {
        const playerCount = event.target.value;
        currentCount = playerCount;
        const newSrc = `./img/map/map${playerCount}p/background.jpeg`;
        
        mapImage.src = newSrc;
        mapImage.alt = `Карта для ${playerCount} игроков`;
        
        loadMapData(playerCount);
        infoPanel.textContent = 'Кликните по карте, чтобы выбрать регион';
        clearHighlights();
        
        console.log(`Количество игроков изменено на: ${playerCount}. Путь к карте: ${newSrc}`);
    });

    mapImage.addEventListener('click', handleMapClick);

    // Инициализация
    loadMapData(playerCountSelect.value);
});
