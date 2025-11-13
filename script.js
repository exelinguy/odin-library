const myLibrary = [];

function Book(title, author, pages, read = false) {
    this.id = crypto.randomUUID();
    this.title = title;
    this.author = author;
    this.pages = pages;
    this.read = read;
}

function addBookToLibrary(title, author, pages, read) {
    const book = new Book(title, author, pages, read);
    myLibrary.push(book);
}

function displayLibrary() {
    const container = document.getElementById('library-container');
    const template = document.getElementById('book-template');
    
    // Clear the container safely
    container.replaceChildren();

    for (const book of myLibrary) {
        const clone = template.content.cloneNode(true);
        
        // Refactored: Find the element and set text in one line
        clone.querySelector('.book-title').textContent = book.title;
        clone.querySelector('.book-author').textContent = book.author;
        clone.querySelector('.book-pages').textContent = book.pages;
        clone.querySelector('.book-read').textContent = book.read ? 'Read' : 'Not read';

        container.appendChild(clone);
    }
}

// Temporary: Manually add data to test
addBookToLibrary('The Hobbit', 'J.R.R. Tolkien', 295, false);
addBookToLibrary('1984', 'George Orwell', 328, true);

// Initial call
displayLibrary();

// new book button and show form modal
document.getElementById('new-book').addEventListener('click', () => {
    document.getElementById('book-dialog').showModal()
});

document.getElementById('new-book-form').addEventListener('submit', (e) => {
    e.preventDefault()
});