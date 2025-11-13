const myLibrary = [];

function Book(title, author, pages, read = false) {
  this.id = crypto.randomUUID();
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.read = read;
}

// The prototype method for toggle
Book.prototype.toggleRead = function () {
  this.read = !this.read;
};

function addBookToLibrary(title, author, pages, read) {
  const book = new Book(title, author, pages, read);
  myLibrary.push(book);
}

function displayLibrary() {
  const container = document.getElementById("library-container");
  const template = document.getElementById("book-template");

  // Clear the container without using .innerHTML
  container.replaceChildren();

  //Main loop
  for (const book of myLibrary) {
    const clone = template.content.cloneNode(true);

    clone.querySelector(".book-title").textContent = book.title;
    clone.querySelector(".book-author").textContent = book.author;
    clone.querySelector(".book-pages").textContent = book.pages;
    clone.querySelector(".book-read-checkbox").checked = book.read;

    // Checkbox event listener
    clone
      .querySelector(".book-read-checkbox")
      .addEventListener("change", () => {
        book.toggleRead();
      });

    // Remove button
    clone.querySelector(".remove-btn").addEventListener("click", () => {
      const index = myLibrary.indexOf(book);
      if (index > -1) {
        myLibrary.splice(index, 1);
        displayLibrary();
      }
    });
    container.appendChild(clone);
  }
}

// Temporary: Manually add data to test
addBookToLibrary("The Hobbit", "J.R.R. Tolkien", 295, false);
addBookToLibrary("1984", "George Orwell", 328, true);

// Initial call
displayLibrary();

// New book form handling
document.getElementById("new-book").addEventListener("click", () => {
  document.getElementById("book-dialog").showModal();
});

// Cancel button
document.getElementById("cancel-btn").addEventListener("click", () => {
  document.getElementById("book-dialog").close();
  document.getElementById("new-book-form").reset();
});

// Submit button form handling
document.getElementById("new-book-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const title = formData.get("title");
  const author = formData.get("author");
  const pages = formData.get("pages");
  const read = formData.get("read") === "on";

  addBookToLibrary(title, author, pages, read);
  displayLibrary();
  document.getElementById("book-dialog").close();
  e.target.reset();
});
