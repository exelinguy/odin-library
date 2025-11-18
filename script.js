// --- 1. Book Class (Model) ---
class Book {
  constructor(title, author, pages, read = false, coverUrl) {
    this.id = crypto.randomUUID();
    this.title = title;
    this.author = author;
    this.pages = pages;
    this.read = read;
    this.coverUrl =
      coverUrl ||
      "https://placehold.co/129x180?text=No+Cover&font=PlayfairDisplay";
  }

  toggleRead() {
    this.read = !this.read;
    // Interaction with the global library instance
    libraryInstance.saveLocal();
    DisplayController.displayLibrary();
  }

  remove() {
    // Interaction with the global library instance
    libraryInstance.removeBook(this.id);
    DisplayController.displayLibrary();
  }
}

// --- 2. Library Class (Central Data Management) ---
class Library {
  constructor() {
    this.myLibrary = [];
    this.restoreLocal();
  }

  // Private method (prefixed with _ conventionally in JS)
  _saveLocal() {
    localStorage.setItem("myLibrary", JSON.stringify(this.myLibrary));
  }

  // Public method to save (exposed for external use, e.g., Book methods)
  saveLocal() {
    this._saveLocal();
  }

  // Public method for rehydration
  restoreLocal() {
    const data = localStorage.getItem("myLibrary");
    if (data) {
      const books = JSON.parse(data);
      this.myLibrary.length = 0; // Clear array

      // Rehydrate: Turn plain objects back into Book objects
      books.forEach((bookData) => {
        const newBook = new Book(
          bookData.title,
          bookData.author,
          bookData.pages,
          bookData.read,
          bookData.coverUrl
        );
        newBook.id = bookData.id;
        this.myLibrary.push(newBook);
      });
    }
  }

  // Public data access method
  getLibrary() {
    return this.myLibrary;
  }

  // Public method for adding a book
  addBookToLibrary(title, author, pages, read, coverUrl) {
    const book = new Book(title, author, pages, read, coverUrl);
    this.myLibrary.push(book);
    this._saveLocal();
  }

  // Public method for removal
  removeBook(bookId) {
    const index = this.myLibrary.findIndex((book) => book.id === bookId);
    if (index > -1) {
      this.myLibrary.splice(index, 1);
      this._saveLocal();
    }
  }
}

// Create the single global instance of the Library
const libraryInstance = new Library();

// --- 3. DisplayController (IIFE Module for DOM Manipulation) ---
const DisplayController = (() => {
  const container = document.getElementById("library-container");
  const template = document.getElementById("book-template");
  const refreshNotice = document.getElementById("refresh-notice");
  const form = document.getElementById("new-book-form");

  const displayLibrary = () => {
    // Get data from the Library instance
    const library = libraryInstance.getLibrary();
    container.replaceChildren();

    if (library.length === 0) {
      refreshNotice.innerText = "Add a book!";
      return;
    }

    // Main loop
    for (const book of library) {
      const clone = template.content.cloneNode(true);

      const coverImg = clone.querySelector(".book-cover");
      coverImg.src = book.coverUrl;
      coverImg.onerror = function () {
        this.src =
          "https://placehold.co/128x190?text=No+Cover&font=PlayfairDisplay";
      };

      clone.querySelector(".book-title").textContent = book.title;
      clone.querySelector(".book-author").textContent = book.author;
      clone.querySelector(".book-pages").textContent = book.pages;

      // Read Checkbox
      const readCheckbox = clone.querySelector(".book-read-checkbox");
      readCheckbox.checked = book.read;
      readCheckbox.addEventListener("change", () => {
        book.toggleRead();
      });

      // Remove button
      clone.querySelector(".remove-btn").addEventListener("click", () => {
        book.remove();
      });
      container.appendChild(clone);
    }

    refreshNotice.innerText = "Your data is saved. Try refreshing the page :)";
  };

  const initEventListeners = () => {
    // New book form handling
    document.getElementById("new-book").addEventListener("click", () => {
      document.getElementById("book-dialog").showModal();
    });

    // Cancel button
    document.getElementById("cancel-btn").addEventListener("click", () => {
      document.getElementById("book-dialog").close();
      form.reset();
    });

    // Submit button form handling
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const title = formData.get("title");
      const author = formData.get("author");
      const pages = formData.get("pages");
      const read = formData.get("read") === "on";
      const coverUrl = formData.get("coverUrl");

      // Use the Library instance to add the book
      libraryInstance.addBookToLibrary(title, author, pages, read, coverUrl);

      displayLibrary();
      document.getElementById("book-dialog").close();
      e.target.reset();
      document.getElementById("cover-url-input").value = "";
    });

    // Optional: Close dropdown if user clicks outside of it
    document.addEventListener("click", (e) => {
      const resultsContainer = document.getElementById("search-results");
      if (!e.target.closest(".search-wrapper")) {
        resultsContainer.style.display = "none";
      }
    });
  };

  return {
    init: () => {
      // Library instance is created and restored automatically, so just init events and display
      initEventListeners();
      displayLibrary();
    },
    displayLibrary,
  };
})();

// --- 4. OpenLibraryAPI (IIFE Module for External Fetching) ---
const OpenLibraryAPI = (() => {
  const searchBtn = document.getElementById("search-btn");
  const titleInput = document.getElementById("title-input");
  const resultsContainer = document.getElementById("search-results");
  const form = document.getElementById("new-book-form");

  const searchBooks = async (title) => {
    // Fetch with sorting by edition count
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${title
        .split(" ")
        .join("+")}&sort=editions`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.docs.slice(0, 10);
  };

  const fetchBookDetails = async (coverEditionKey) => {
    const response = await fetch(
      `https://openlibrary.org/books/${coverEditionKey}.json`
    );
    if (response.ok) {
      return await response.json();
    }
    return {};
  };

  const handleResultSelection = (book) => {
    // Inner function for click handling
    return async () => {
      titleInput.value = "Fetching details...";
      resultsContainer.style.display = "none";
      titleInput.disabled = true;

      try {
        const author = book.author_name ? book.author_name[0] : "Unknown";
        let pages = 0;
        let finalTitle = book.title;

        if (book.cover_edition_key) {
          const details = await fetchBookDetails(book.cover_edition_key);
          pages = details.number_of_pages || 0;
          if (details.title) finalTitle = details.title;
        }

        // Fill the Form
        form.querySelector('[name="author"]').value = author;
        form.querySelector('[name="pages"]').value = pages;
        const coverUrl = book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : "";
        document.getElementById("cover-url-input").value = coverUrl;

        // Finalize UI
        titleInput.value = finalTitle;
        titleInput.style.borderColor = "green";
      } catch (error) {
        console.error("Error fetching details:", error);
        alert("Could not load book details.");
        titleInput.value = book.title;
      } finally {
        titleInput.disabled = false;
      }
    };
  };

  const initSearchListener = () => {
    searchBtn.addEventListener("click", async () => {
      const title = titleInput.value.trim();
      if (!title) {
        alert("Please enter a title first!");
        return;
      }

      searchBtn.textContent = "Searching...";
      searchBtn.disabled = true;
      resultsContainer.replaceChildren();
      resultsContainer.style.display = "none";

      try {
        const topResults = await searchBooks(title);

        if (topResults.length > 0) {
          resultsContainer.style.display = "block";

          topResults.forEach((book) => {
            const item = document.createElement("div");
            item.classList.add("result-item");
            const author = book.author_name ? book.author_name[0] : "Unknown";
            const year = book.first_publish_year || "?";
            item.textContent = `${book.title} (${year}) - ${author}`;

            item.addEventListener("click", handleResultSelection(book));
            resultsContainer.appendChild(item);
          });
        } else {
          alert("No books found.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Something went wrong with the search.");
      } finally {
        searchBtn.textContent = "Search";
        searchBtn.disabled = false;
      }
    });
  };

  return {
    init: initSearchListener,
  };
})();

// --- 5. Application Initialization ---
// The libraryInstance is already created and restored data on its own.
DisplayController.init();
OpenLibraryAPI.init();
