import { prisma } from "./db.server";
import { createCookieSessionStorage, redirect } from "@remix-run/node"

const API_URL = process.env.API_URL;

// Authentication start
export async function authenticateUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) throw new Error("Authentication failed");
  const data = await response.json();
  return { token: data.token_key, firstName: data.user.first_name,id: data.user.id };
}

export async function createUser(token: string,userData: any){
  try{
    const response = await fetch(`${API_URL}/users`,{
      method: "POST",
      headers: { Authorization: `Bearer ${token}`,"Content-Type": "application/json" },
      body: JSON.stringify(userData)

    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || "Failed to create user";
      throw new Error(errorMessage);
    }
    const newUser = await response.json();
    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}
export async function getUser(token: string, userId: number){
  const response = await fetch(`${API_URL}/users/${userId}`,{
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${userId} user`);
  }

  const user = await response.json();

  return user;
}

export async function updateUser(token: string, userId: number,userData: any){
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`,"Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update ${userId} user`);
  }

  const user = await response.json();

  return user;
}

export async function deleteUser(token: string, userId: number){
  const response = await fetch(`${API_URL}/authors/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to delete user with ID ${userId}`);
  }

  return { success: true, message: "User deleted successfully" };
}


// Create session storage
const storage = createCookieSessionStorage({
  cookie: {
    name: 'remixblog_session',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
    httpOnly: true,
  },
})

// Create user session
export async function createUserSession(userToken: string,userId: number,userName: string, redirectTo: string) {
  const session = await storage.getSession()
  session.set('userToken', userToken)
  session.set('userId', userId)
  session.set('userName', userName)
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  })
}

// Get user session
export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'))
}

// Logout user and destroy session
export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get('Cookie'))
  return redirect('/logout', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  })
}

// Authentication End


// Authors Start
export async function fetchAuthors(token: string) {
  const response = await fetch(`${API_URL}/authors?orderBy=id&direction=ASC&limit=12&page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch authors");
  }

  const authorsResponse = await response.json();
  const authors: { id: number; first_name: string; last_name: string }[] = authorsResponse?.items || [];

  // Fetch detailed author data (including book count) for each author
  const detailedAuthors = await Promise.all(
    authors.map(async (author: { id: number; first_name: string; last_name: string }) => {
      const singleAuthorData = await getSingleAuthor(token, author.id);
      return {
        ...author, // Keep original author data
        books_count: singleAuthorData.books?.length || 0, // Add books count
      };
    })
  );

  return detailedAuthors;
}

export async function getSingleAuthor(token: string, authorId: number) {
  const response = await fetch(`${API_URL}/authors/${authorId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${authorId} author`);
  }

  const author = await response.json();

  return {
    ...author,
    books_count: author.books?.length || 0, // Add books count
  };
}

export async function deleteAuthor(token: string, authorId: number){
  const response = await fetch(`${API_URL}/authors/${authorId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to delete author with ID ${authorId}`);
  }

  return { success: true, message: "Author deleted successfully" };
}
// Authors End

// Books Start
export async function fetchBooks(
  token: string,
  title: string = "",
  year: string = ""
) {
  const response = await fetch(`${API_URL}/books?orderBy=id&direction=ASC&limit=12&page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const url = new URL(`${API_URL}/books`);
  if (title) {
    url.searchParams.set("title", title);
  }
  if (year) {
    url.searchParams.set("year", year);
  }

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.message || "Failed to fetch books";
    throw new Error(errorMessage);
  }

  const booksResponse = await response.json();
  const items = booksResponse?.items;
  const books = Array.isArray(items)? items: items? [items]:[]; 

  const detailedBooks = await Promise.all(
    books.map(async (book: { id: number; title: string }) => {
      try {
        const singleBookData = await getSingleBook(token, book.id);
        if (singleBookData) {
          return {...book,...singleBookData };
        } else {
          console.warn(`No details found for Book ID: ${book.id}`);
          return book;
        }
      } catch (error) {
        console.error(`Error fetching details for Book ID ${book.id}:`, error);
        return book;
      }
    })
  );
  return detailedBooks;
}

export async function createBook(token: string,bookData: any) {
  try {
    const response = await fetch(`${API_URL}/books`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`,"Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || "Failed to create book";
      throw new Error(errorMessage);
    }
    const newBook = await response.json();
    return newBook;
  } catch (error) {
    console.error("Error creating book:", error);
    throw error;
  }
}

export async function updateBook(token: string,bookId: number,bookData: any) {
  try {
    const response = await fetch(`${API_URL}/books/${bookId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`,"Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || "Failed to update book";
      throw new Error(errorMessage);
    }
    const newBook = await response.json();
    return newBook;
  } catch (error) {
    console.error("Error updating book:", error);
    throw error;
  }
}



export async function getSingleBook(token: string, bookId: number) {
  const response = await fetch(`${API_URL}/books/${bookId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${bookId} book`);
  }

  const book = await response.json();

  return book;
}

export async function deleteBook(token: string, bookId: number){
  const response = await fetch(`${API_URL}/books/${bookId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to delete book with ID ${bookId}`);
  }

  return { success: true, message: "Book deleted successfully" };
}

// Books End