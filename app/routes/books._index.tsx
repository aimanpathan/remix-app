import {
    Card,
    DataTable,
    TextField,
    Button,
    Text,
    InlineStack,
    Page
  } from "@shopify/polaris";
  import { useState, useCallback, useEffect } from "react";
  import { redirect, useLoaderData, useSearchParams,useNavigate } from "@remix-run/react";
  import { json, LoaderFunction } from "@remix-run/node";
  import { getUserSession, fetchBooks } from "~/routes/utils/auth.server";
  
  type Book = {
        id: number;
        title: string;
        release_date?: string;
        isbn?: string;
        format?: string;
        number_of_pages?: number;
        author: {};
    };
  
  export const loader: LoaderFunction = async ({ request }) => {
    const auth = await getUserSession(request);
    if (!auth.data) {
      return redirect("/");
    }
  
    const url = new URL(request.url);
    const titleQuery = url.searchParams.get("title") || "";
    const yearQuery = url.searchParams.get("year") || "";
  
    const booksResponse = await fetchBooks(
      auth.data.userToken,
      titleQuery,
      yearQuery
    );
    const books = booksResponse || [];
  
    return json({ books, titleQuery, yearQuery });
  };
  
  export default function Books() {
    const { books, titleQuery, yearQuery } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
  
    const [titleFilter, setTitleFilter] = useState(titleQuery);
    const [yearFilter, setYearFilter] = useState(yearQuery);
    const [filteredBooks, setFilteredBooks] = useState(books); // Initialize with all books

    useEffect(() => {
        const filterBooks = () => {
          const filtered = books.filter((book: Book) => {
            const titleMatch = book.title.toLowerCase().includes(titleFilter.toLowerCase());
      
            // Check if book.release_date is defined before creating a Date object
            const yearMatch =!yearFilter || (book.release_date && new Date(book.release_date).getFullYear().toString() === yearFilter);
      
            return titleMatch && yearMatch;
          });
          setFilteredBooks(filtered);
        };
      
        filterBooks();
      }, [books, titleFilter, yearFilter]);

    const handleTitleFilterChange = useCallback((value:string) => {
      setTitleFilter(value);
      setSearchParams((prev) => {
        prev.set("title", value);
        return prev;
      });
    },[]);
  
    const handleYearFilterChange = useCallback((value:string) => {
      setYearFilter(value);
      setSearchParams((prev) => {
        prev.set("year", value);
        return prev;
      });
    },[]);
  
    const applyFilters = () => {
      setSearchParams((prev) => {
        prev.set("title", titleFilter);
        prev.set("year", yearFilter);
        return prev;
      });
    };
  
    const clearFilters = () => {
      setTitleFilter("");
      setYearFilter("");
      setSearchParams((prev) => {
        prev.delete("title");
        prev.delete("year");
        return prev;
      });
    };
  

    const rows = filteredBooks.map((book: Book) => [
        book.id,
        book.title,
        book.release_date?new Date(book.release_date).toLocaleDateString(): "N/A",
        book.number_of_pages?? "N/A",
        <Button url={`/books/${book.id}`} key={book.id}>
        View
        </Button>,

    ]);
    
    return (
      <Page
        fullWidth
        title="Book Listing"
        primaryAction={{
          content: "Add Book",
          onAction: () => navigate(`/books/new`),
        }}
      >
        <Card>
            <InlineStack gap="300" blockAlign="end">
              <InlineStack>
                  <Text as="h3" variant="headingLg"> Filters</Text>
              </InlineStack>
              <InlineStack>
                <TextField
                  label="Title"
                  value={titleFilter}
                  onChange={handleTitleFilterChange}
                  clearButton
                  onClearButtonClick={clearFilters}
                  autoComplete="title"
                />
              </InlineStack>
              <InlineStack>
                <TextField
                  label="Year"
                  value={yearFilter}
                  onChange={handleYearFilterChange}
                  clearButton
                  onClearButtonClick={clearFilters}
                  autoComplete="year"
                />
              </InlineStack>
              <InlineStack>
                <Button size="large" onClick={applyFilters} variant="primary">Apply</Button>
              </InlineStack>
            </InlineStack>
          <DataTable
            columnContentTypes={["numeric", "text", "text", "numeric", "text"]}
            headings={["Book ID", "Title", "Release Date", "No of pages", "Actions"]}
            rows={rows}
          />
        </Card>
      </Page>
    );
  }