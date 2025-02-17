import {
    Card,
    TextField,
    Button,
    FormLayout,
    Page,
    Layout,
    Text,
    Select
  } from "@shopify/polaris";
  import { useState, useCallback } from "react";
  import { redirect, useNavigate, Form, useLoaderData } from "@remix-run/react";
  import { json, ActionFunction, LoaderFunction } from "@remix-run/node";
  import { getUserSession, createBook, fetchAuthors } from "~/routes/utils/auth.server";
  
  // Define a type for the book data (no ID since it's a new book)
  type NewBook = Omit<Book, "id">;
  
  type Author = {
    id: number;
    first_name: string;
    last_name: string;
    books_count?: number;
  };

  export const loader: LoaderFunction = async ({ request }) => {
    const auth = await getUserSession(request);
    if (!auth.data) {
      return redirect("/login");
    }

    try {
        const authorsResponse = await fetchAuthors(auth.data.userToken);
    
        const authors: Author[] = authorsResponse || [];
        
        return json({ authors });
    } catch (error) {
        console.error("Error creating book:", error);
        return json({ error: "Failed to create book" }, { status: 500 });
    }
}
  export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const auth = await getUserSession(request);
    if (!auth.data) {
      return redirect("/login");
    }
  
    const title = formData.get("title");
    const authorId = formData.get("author");
    const release_date = formData.get("release_date");
    const description = formData.get("description");
    const isbn = formData.get("isbn");
    const format = formData.get("format");
    const number_of_pages = formData.get("number_of_pages");
  
    if (
      typeof title!== "string" ||
      typeof authorId!== "string" ||
      typeof release_date!== "string" ||
      typeof description!== "string" ||
      typeof isbn!== "string" ||
      typeof format!== "string" ||
      typeof number_of_pages!== "string"
    ) {
      return json({ error: "Invalid book data" }, { status: 400 });
    }
  
    try {
      // Call createBook without the bookId
      const response = await createBook(auth.data.userToken, {
        "title": title,
        "author":{
            "id": authorId,
        },
        "release_date": new Date(release_date).toISOString(),
        "description": description,
        "isbn": isbn,
        "format": format,
        "number_of_pages": parseInt(number_of_pages),
      });
      return {}
    } catch (error) {
      console.error("Error creating book:", error);
      return json({ error: "Failed to create book" }, { status: 500 });
    }
  };
  
  export default function NewBook() {
    const { authors } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
  const [newBook, setNewBook] = useState<NewBook>({
    author: { id: 0 }, // Or however you handle author selection
    title: "",
    release_date: "",
    description: "",
    isbn: "",
    format: "",
    number_of_pages: 0,
  });
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = useCallback((field: keyof NewBook, value: string) => {
    setNewBook((prevBook) => ({...prevBook, [field]: value }));
  },[]);
  const options = authors.map((author: Author) => ({
    label: author.first_name+" "+author.last_name, 
    value: author.id.toString(),
  }));
  
    return (
      <Page
        fullWidth
        title="Book Details"
        primaryAction={{
          content: "Back",
          onAction: () => navigate(`/books`),
        }}
      >
        <Layout>
          <Layout.Section>
            <Card>
            <Form method="post" onSubmit={() => {setSuccessMessage("Book saved successfully!")}}>
                <FormLayout>
                  <TextField
                    label="Title"
                    value={newBook.title}
                    name="title"
                    onChange={(value) => handleInputChange("title", value)}
                    autoComplete="title"
                  />
                  <Select
                    label="Select Authors"
                    options={options}
                    name="author"
                    value={newBook.author.id}
                    onChange={(value) => handleInputChange("author", value)}
                    />
                  <TextField
                    label="Release Date"
                    type="date"
                    name="release_date"
                    value={newBook.release_date.slice(0, 10)}
                    onChange={(value) => handleInputChange("release_date", value)}
                    autoComplete="release_date"
                  />
                  <TextField
                    label="Description"
                    value={newBook.description}
                    name="description"
                    onChange={(value) =>
                      handleInputChange("description", value)
                    }
                    multiline
                    autoComplete="description"
                  />
                  <TextField
                    label="ISBN"
                    value={newBook.isbn}
                    name="isbn"
                    onChange={(value) => handleInputChange("isbn", value)}
                    autoComplete="isbn"
                  />
                  <TextField
                    label="Format"
                    value={newBook.format}
                    name="format"
                    onChange={(value) => handleInputChange("format", value)}
                    autoComplete="format"
                  />
                  <TextField
                    label="Number of Pages"
                    type="number"
                    name="number_of_pages"
                    value={newBook.number_of_pages.toString()}
                    onChange={(value) =>
                      handleInputChange(
                        "number_of_pages",
                        value === ""? "0": value
                      )
                    }
                    autoComplete="pages"
                  />
                  <Button submit>Save</Button>
                  <Text as="span" variant="headingSm" id="responseText" tone="success">{successMessage}</Text>
                </FormLayout>
              </Form>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }