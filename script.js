const myLibrary = [];

function Book(title, author, pages, read = false, coverUrl) {
  this.id = crypto.randomUUID();
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.read = read;
  this.coverUrl =
    coverUrl ||
    "https://placehold.co/129x180?text=No+Cover&font=PlayfairDisplay";
}

// The prototype method for toggle
Book.prototype.toggleRead = function () {
  this.read = !this.read;
};

function addBookToLibrary(title, author, pages, read, coverUrl) {
  const book = new Book(title, author, pages, read, coverUrl);
  myLibrary.push(book);
  saveLocal();
}

function displayLibrary() {
  const container = document.getElementById("library-container");
  const template = document.getElementById("book-template");

  // Clear the container without using .innerHTML
  container.replaceChildren();

  //Main loop
  for (const book of myLibrary) {
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
    clone.querySelector(".book-read-checkbox").checked = book.read;

    // Checkbox event listener
    clone
      .querySelector(".book-read-checkbox")
      .addEventListener("change", () => {
        book.toggleRead();
        saveLocal();
      });

    // Remove button
    clone.querySelector(".remove-btn").addEventListener("click", () => {
      const index = myLibrary.indexOf(book);
      if (index > -1) {
        myLibrary.splice(index, 1);
        saveLocal();
        displayLibrary();
      }
      //Refresh-notice
      if (!container.hasChildNodes()) {
        document.getElementById("refresh-notice").innerText = "Add a book!";
      }
    });
    container.appendChild(clone);
  }
  //Refresh-notice
  if (container.hasChildNodes()) {
    document.getElementById("refresh-notice").innerText =
      "Your data is saved. Try refreshing the page :)";
  }
}

// Load saved data if any
restoreLocal();

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
  const coverUrl = formData.get("coverUrl");

  addBookToLibrary(title, author, pages, read, coverUrl);
  displayLibrary();
  document.getElementById("book-dialog").close();
  e.target.reset();
  document.getElementById("cover-url-input").value = "";
});

// Persistant storage
function saveLocal() {
  localStorage.setItem("myLibrary", JSON.stringify(myLibrary));
}

function restoreLocal() {
  const data = localStorage.getItem("myLibrary");
  if (data) {
    const books = JSON.parse(data);

    // Empty the current array just in case
    myLibrary.length = 0;

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

      myLibrary.push(newBook);
    });

    displayLibrary();
  }
}

// OpenLibrary API Implementation
const searchBtn = document.getElementById("search-btn");
const titleInput = document.getElementById("title-input");

const resultsContainer = document.getElementById("search-results");

searchBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();

  if (!title) {
    alert("Please enter a title first!");
    return;
  }

  searchBtn.textContent = "Searching...";
  searchBtn.disabled = true;

  // Clear previous results and hide dropdown initially
  resultsContainer.replaceChildren();
  resultsContainer.style.display = "none";

  try {
    // Fetch with sorting by edition count to get popular works first
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${title
        .split(" ")
        .join("+")}&sort=editions`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();

    // Take the top 5 results
    const topResults = data.docs.slice(0, 10);

    if (topResults.length > 0) {
      // Show the dropdown
      resultsContainer.style.display = "block";

      // Loop through results and create clickable items
      topResults.forEach((book) => {
        const item = document.createElement("div");
        item.classList.add("result-item");

        // Display Title, Author, and Year (if available)
        const author = book.author_name ? book.author_name[0] : "Unknown";
        const year = book.first_publish_year || "?";
        item.textContent = `${book.title} (${year}) - ${author}`;

        console.log("Raw Book Data:", book);

        // Add Click Listener to THIS specific result
        item.addEventListener("click", async () => {
          // 1. UX: Show loading state immediately
          titleInput.value = "Fetching details...";
          resultsContainer.style.display = "none"; // Hide dropdown
          titleInput.disabled = true; // Prevent typing while loading

          try {
            // 2. Define default values from the Search Result (as backup)
            let pages = 0;
            let finalTitle = book.title;

            // 3. The "Source of Truth" Fetch
            // We rely on the edition key to get the specific book details
            if (book.cover_edition_key) {
              const response = await fetch(
                `https://openlibrary.org/books/${book.cover_edition_key}.json`
              );
              if (response.ok) {
                const details = await response.json();

                // Get the exact pages
                pages = details.number_of_pages || 0;

                // Optional: Get the full title (e.g., "Harry Potter and the..." instead of just "Harry Potter")
                if (details.title) finalTitle = details.title;
              }
            }

            // 4. Fill the Form
            const form = document.getElementById("new-book-form");

            // Author comes from the search result (it's usually cleaner there)
            form.querySelector('[name="author"]').value = author;
            form.querySelector('[name="pages"]').value = pages;

            // Handle Cover
            const coverUrl = book.cover_i
              ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
              : "";
            document.getElementById("cover-url-input").value = coverUrl;

            // 5. Finalize UI
            titleInput.value = finalTitle;
            titleInput.style.borderColor = "green";
          } catch (error) {
            console.error("Error fetching details:", error);
            alert("Could not load book details.");
            titleInput.value = book.title; // Revert title on error
          } finally {
            titleInput.disabled = false; // Re-enable input
          }
        });

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

// Optional: Close dropdown if user clicks outside of it
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) {
    resultsContainer.style.display = "none";
  }
});
