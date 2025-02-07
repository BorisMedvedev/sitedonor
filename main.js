document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const parseBtn = document.getElementById('parseBtn');
  const imagesGrid = document.getElementById('imagesGrid');
  const loader = document.getElementById('loader');

  parseBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();

    if (!url) {
      alert('Введите корректный URL');
      return;
    }

    // Показываем loader
    loader.style.display = 'flex';
    imagesGrid.innerHTML = '';

    try {
      // Расширенные методы получения HTML
      const html = await fetchHTML(url);

      // Создаем временный контейнер для парсинга
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = html;

      // Расширенный поиск изображений
      const images = findImages(tempContainer, url);

      if (images.length === 0) {
        alert('Изображения не найдены. Попробуйте другой сайт.');
        return;
      }

      // Уникальные изображения
      const uniqueImages = [...new Set(images)];

      uniqueImages.forEach((imageUrl, index) => {
        const imageItem = createImageElement(imageUrl, index);
        imagesGrid.appendChild(imageItem);
      });

      // Добавляем обработчики для кнопок скачивания
      document.querySelectorAll('.download-btn').forEach((btn) => {
        btn.addEventListener('click', downloadImage);
      });
    } catch (error) {
      console.error('Глобальная ошибка:', error);
      alert(`Не удалось загрузить изображения: ${error.message}`);
    } finally {
      loader.style.display = 'none';
    }
  });

  // Расширенная функция получения HTML
  async function fetchHTML(url) {
    const proxyUrls = [
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/',
    ];

    for (let proxyUrl of proxyUrls) {
      try {
        const response = await fetch(`${proxyUrl}${encodeURIComponent(url)}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        if (!response.ok)
          throw new Error('Не удалось загрузить страницу, повторите попытку');

        return await response.text();
      } catch (error) {
        console.warn('Ошибка прокси:', error);
      }
    }

    throw new Error(
      'Не удалось загрузить страницу через прокси, повторите попытку'
    );
  }

  // Расширенный поиск изображений
  function findImages(container, baseUrl) {
    const imageSelectors = [
      'img',
      '[data-src]',
      '[src*=".jpg"]',
      '[src*=".png"]',
      '[src*=".jpeg"]',
      '[style*="background-image"]',
    ];

    const images = [];
    const processedUrls = new Set();

    imageSelectors.forEach((selector) => {
      const elements = container.querySelectorAll(selector);

      elements.forEach((el) => {
        let imageUrl = '';

        // Различные способы извлечения URL
        if (el.tagName === 'IMG') {
          imageUrl = el.src || el.getAttribute('data-src');
        } else if (el.hasAttribute('data-src')) {
          imageUrl = el.getAttribute('data-src');
        } else if (el.hasAttribute('style')) {
          const bgImage = el.style.backgroundImage;
          const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match) imageUrl = match[1];
        }

        // Нормализация URL
        if (imageUrl) {
          try {
            imageUrl = new URL(imageUrl, baseUrl).href;
          } catch (urlError) {
            console.warn('Ошибка обработки URL:', urlError);
            return;
          }

          // Фильтрация и проверка уникальности
          if (isValidImageUrl(imageUrl) && !processedUrls.has(imageUrl)) {
            images.push(imageUrl);
            processedUrls.add(imageUrl);
          }
        }
      });
    });

    return images;
  }

  // Улучшенная валидация URL изображений
  function isValidImageUrl(url) {
    const invalidPatterns = [
      /\.svg$/i, // Исключаем векторные изображения
      /icon/i, // Исключаем иконки
      /logo/i, // Исключаем логотипы
      /favicon/i, // Исключаем favicon
    ];

    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

    // Проверка расширения
    const hasValidExtension = validExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );

    // Проверка на запрещенные паттерны
    const isNotInvalid = !invalidPatterns.some((pattern) => pattern.test(url));

    // Минимальная длина URL
    return hasValidExtension && isNotInvalid && url.length > 10;
  }

  // Создание элемента изображения
  function createImageElement(imageUrl, index) {
    const imageItem = document.createElement('div');
    imageItem.classList.add('image-item');

    imageItem.innerHTML = `
            <img src="${imageUrl}" 
                 alt="Изображение ${index + 1}" 
                 onerror="this.style.display='none'"
                 loading="lazy">
            <button class="download-btn" data-url="${imageUrl}">
                Скачать
            </button>
        `;

    return imageItem;
  }

  // Функция скачивания
  async function downloadImage(event) {
    const imageUrl = event.target.dataset.url;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      alert(`Не удалось скачать изображение: ${error.message}`);
    }
  }
});
