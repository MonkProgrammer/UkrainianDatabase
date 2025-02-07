let movies = [];
let currentPage = 1;
let recordsPerPage = 10;

/*document.getElementById('fileInput').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        try {
            movies = JSON.parse(e.target.result).movies || [];
            renderMovies();
        } catch {
            alert('Invalid JSON format');
        }
    };
    reader.readAsText(file);
});*/


const dataUrl = 'https://raw.githubusercontent.com/MonkProgrammer/UkrainianDatabase/refs/heads/main/ukrainian_old_movies_db.json';

window.addEventListener('load', () => {
    fetchData();
});

function fetchData() {
    fetch(dataUrl)
        .then(response => response.json())
        .then(jsonData => {
            movies = jsonData.movies || [];
            renderMovies();
        })
        .catch(() => {
            alert('error loading');
        });
}

let debounceTimeout;

document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        currentPage = 1;
        renderMovies();
    }, 400);
});


document.getElementById('recordsPerPage').addEventListener('change', (event) => {
    recordsPerPage = parseInt(event.target.value, 10);
    currentPage = 1;
    renderMovies();
});
document.querySelectorAll('.movie-card img').forEach(img => {
    img.addEventListener('load', () => {
        img.classList.add('loaded');
    });
});

function renderMovies() {
    const movieList = document.getElementById('movieList');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    const filteredMovies = movies
        .filter(movie =>
            movie.title.toLowerCase().includes(searchQuery) ||
            movie.year.toString().includes(searchQuery) ||
            (movie.actors && movie.actors.some(actor => actor.toLowerCase().includes(searchQuery))) ||
            (movie.directors && movie.directors.some(director => director.toLowerCase().includes(searchQuery)))
        )
        .sort((a, b) => a.year - b.year);

    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const paginatedMovies = filteredMovies.slice(startIndex, endIndex);

    movieList.innerHTML = '';

    paginatedMovies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'col-md-5 movie-card';

        const poster = movie.images.posters[0] || null;

        card.innerHTML = `
            <div class="preloader ${poster ? '' : 'hidden'}">
                <div class="spinner-border text-secondary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            ${poster ? `<img src="${poster}" alt="${movie.title} Poster" class="movie-poster">` : '<div class="no-poster">No Poster Available</div>'}
            <h5>${movie.title}</h5>
            <p><strong>Рік:</strong> ${movie.year}</p>
            <p><strong>Режисер:</strong> ${movie.directors.slice(0, 4).join(', ')}</p>
            <p><strong>Актори:</strong> ${movie.actors.slice(0, 4).join(', ')}</p>
        `;

        if (poster) {
            const img = card.querySelector('img');
            const preloaderElement = card.querySelector('.preloader');

            img.addEventListener('load', () => {
                img.classList.add('loaded');
                preloaderElement.classList.add('hidden');
            });

            img.addEventListener('error', () => {
                preloaderElement.innerHTML = 'Failed to load image';
            });
        }

        card.addEventListener('click', () => showMovieDetails(movie));
        movieList.appendChild(card);
    });

    renderPaginationControls(filteredMovies.length);
}


function renderPaginationControls(totalRecords) {
    const paginationControls = document.getElementById('paginationControls');
    const totalPages = Math.ceil(totalRecords / recordsPerPage);

    const maxVisibleButtons = 5;

    paginationControls.innerHTML = '';

    const createPageButton = (page, isActive = false) => {
        const pageButton = document.createElement('button');
        pageButton.className = `btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`;
        pageButton.textContent = page;
        pageButton.addEventListener('click', () => {
            currentPage = page;
            renderMovies();
        });
        return pageButton;
    };

    if (currentPage > 1) {
        const firstPageButton = createPageButton(1);
        firstPageButton.innerHTML = '&laquo;';
        paginationControls.appendChild(firstPageButton);
    }

    if (currentPage > 1) {
        const prevPageButton = createPageButton(currentPage - 1);
        prevPageButton.innerHTML = '&lsaquo;';
        paginationControls.appendChild(prevPageButton);
    }

    const startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
        paginationControls.appendChild(createPageButton(i, i === currentPage));
    }

    if (currentPage < totalPages) {
        const nextPageButton = createPageButton(currentPage + 1);
        nextPageButton.innerHTML = '&rsaquo;';
        paginationControls.appendChild(nextPageButton);
    }

    if (currentPage < totalPages) {
        const lastPageButton = createPageButton(totalPages);
        lastPageButton.innerHTML = '&raquo;';
        paginationControls.appendChild(lastPageButton);
    }
}


function showMovieDetails(movie) {
    const modalTitle = document.getElementById('movieModalTitle');
    const modalBody = document.getElementById('movieModalBody');
    const modal = new bootstrap.Modal(document.getElementById('movieModal'));

    modalTitle.textContent = movie.title;
    modalBody.innerHTML = '';

    if (movie.images.posters && movie.images.posters.length > 0) {
        const mainPoster = document.createElement('img');
        mainPoster.src = movie.images.posters[0];
        mainPoster.alt = `${movie.title} Poster`;
        mainPoster.className = 'main-poster';
        modalBody.appendChild(mainPoster);
    }

    const infoSection = document.createElement('div');
    infoSection.className = 'info-section';
    infoSection.innerHTML = `
<p><strong>Рік:</strong> ${movie.year}</p>
<p><strong>Країна:</strong> ${movie.country}</p>
<p><strong>Мова:</strong> ${movie.language}</p>
<p><strong>Компанія:</strong> ${movie.production_company == null ? 'невідомо' : movie.production_company}</p>
<p><strong>Режисери:</strong> ${movie.directors.join(', ')}</p>
<p><strong>Сценаристи:</strong> ${movie.screenwriters.join(', ')}</p>
<p><strong>Актори:</strong> ${movie.actors.join(', ')}</p>
<p><strong>Опис:</strong> ${movie.description}</p>
<p><strong>Жанри:</strong> ${movie.genres.join(', ')}</p>
<p><strong>Теги:</strong> ${movie.tags.join(', ') || 'відсутні'}</p>
<p><strong>Бюджет:</strong> ${movie.budget == null ? 'Невідомо' : movie.budget}</p>
<p><strong>Хронометраж:</strong> ${movie.runtime == null ? 'Невідомо' : movie.runtime} хвилин</p>
`;
    modalBody.appendChild(infoSection);

    if (movie.links && movie.links.length > 0) {
        const linksSection = document.createElement('div');
        linksSection.className = 'links-section mt-3';
        linksSection.innerHTML = `<h5>Посилання</h5>`;
        movie.links.forEach(link => {
            const linkButton = document.createElement('a');
            linkButton.href = link.url;
            linkButton.target = '_blank';
            linkButton.className = 'btn btn-secondary btn-sm me-2 mb-2';
            linkButton.innerHTML = `<i class="bi bi-link-45deg"></i> ${link.description}`;
            linksSection.appendChild(linkButton);
        });
        modalBody.appendChild(linksSection);
    }

    const imagesSection = document.createElement('div');
    imagesSection.className = 'images-section';
    imagesSection.innerHTML = `
<h5>Постери</h5>
<div id="postersContainer" class="d-flex flex-wrap"></div>
<button id="loadMorePosters" class="btn btn-sm btn-secondary mt-2">Show More Posters</button>

<h5 class="mt-3">Кадри</h5>
<div id="stillsContainer" class="d-flex flex-wrap"></div>
<button id="loadMoreStills" class="btn btn-sm btn-secondary mt-2">Show More Stills</button>
`;
    modalBody.appendChild(imagesSection);

    loadImages(movie.images.posters, 'postersContainer', 'loadMorePosters');
    loadImages(movie.images.stills, 'stillsContainer', 'loadMoreStills');


    modal.show();
}

function loadImages(images, containerId, buttonId) {
    const container = document.getElementById(containerId);
    const button = document.getElementById(buttonId);
    let loadedCount = 0;
    const batchSize = 5;

    function loadBatch() {
        const remaining = images.slice(loadedCount, loadedCount + batchSize);
        remaining.forEach(imageUrl => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';

            const preloader = document.createElement('div');
            preloader.className = 'preloader';
            preloader.innerHTML = `<div class="spinner-border text-primary" role="status"></div>`;

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = 'Image';
            img.className = 'stills-image img-fluid rounded';
            img.loading = 'lazy';
            img.onerror = () => img.replaceWith(document.createTextNode("Ошибка загрузки"));

            img.addEventListener('load', () => {
                preloader.remove();
                img.style.opacity = 1;
            });

            wrapper.appendChild(preloader);
            wrapper.appendChild(img);
            container.appendChild(wrapper);
        });

        loadedCount += batchSize;

        if (loadedCount >= images.length) {
            button.style.display = 'none';
        }
    }

    button.addEventListener('click', loadBatch);
    loadBatch();
}
