// STEP 1: Basic modal open/close
const newBookBtn = document.getElementById("new-book");
const bookDialog = document.getElementById("book-dialog");

newBookBtn.addEventListener("click", () => {
  bookDialog.showModal(); // built-in API: opens modal
});

bookDialog.addEventListener("close", () => {
  console.log("Dialog closed with value:", bookDialog.returnValue);
});

// STEP 2: handle form submit without page reload
const newBookForm = document.getElementById("new-book-form");

newBookForm.addEventListener("submit", (e) => {
  e.preventDefault(); // stop default form submission / reload

  // Read values safely using FormData
  const fd = new FormData(newBookForm);
  const title = fd.get("title")?.trim() || "";
  const author = fd.get("author")?.trim() || "";
  const pages = fd.get("pages")?.trim() || "";
  const read = fd.get("read") === "on"; // if you have a checkbox named "read"

  // For now, just log to confirm we got the data
  console.log({ title, author, pages, read });

  // Later we'll add the book to the library array and re-render
  // For now: reset the form and close the dialog manually
  newBookForm.reset();
  bookDialog.close(); // manually close since we prevented default
});

// STEP 3: Book model, demo data, and rendering without innerHTML

// Book factory
function Book(title, author, pages, read = false) {
  return {
    id: crypto.randomUUID(),
    title,
    author,
    pages,
    read: !!read,
  };
}

// in-memory library array (single source of truth)
const myLibrary = [
  Book("The Hobbit", "J.R.R. Tolkien", 295, true),
  Book("Eloquent JavaScript", "Marijn Haverbeke", 450, false),
];

// DOM refs
const booksList = document.getElementById("books-list");
const bookTemplate = document.getElementById("book-template");

// helper: remove all children without innerHTML
function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// create DOM nodes for a single book using the <template>
function createBookNode(book) {
  const clone = bookTemplate.content.cloneNode(true);
  const article = clone.querySelector(".book-card");

  // set data-id for later actions
  article.dataset.id = book.id;

  clone.querySelector(".book-title").textContent = book.title;
  clone.querySelector(".book-author").textContent = `by ${book.author}`;
  clone.querySelector(".book-pages").textContent = `${book.pages} pages`;

  // optionally style based on read state
  if (book.read) article.classList.add("is-read");

  return clone;
}

// render the whole library (deriving UI from myLibrary)
function renderLibrary() {
  clearElement(booksList);
  myLibrary.forEach((book) => {
    booksList.appendChild(createBookNode(book));
  });
}

// initial render
renderLibrary();
