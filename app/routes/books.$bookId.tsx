import {
    Card,
    TextField,
    Button,
    FormLayout,
    Page,
    Layout,
    Text
  } from "@shopify/polaris";
  import { useState, useCallback } from "react";
  import { redirect, useLoaderData, useNavigate, Form } from "@remix-run/react";
  import { json, LoaderFunction, ActionFunction } from "@remix-run/node";
  import { getSingleBook, getUserSession, updateBook,deleteBook } from "~/routes/utils/auth.server";

  type Book = {
    id: number;
    author: {
      id: number;
    };
    title: string;
    release_date: string;
    description: string;
    isbn: string;
    format: string;
    number_of_pages: number;
  };

  export const loader: LoaderFunction = async ({ params, request }) => {
    const auth = await getUserSession(request);
    if (!auth.data) {
      return redirect("/login");
    }
  
    if (!params.bookId) {
      throw new Error("Book ID is required");
    }
  
    const bookId = params.bookId;
    const book = await getSingleBook(auth.data.userToken,Number(bookId));
    return json({ book });
  };
  
  export const action: ActionFunction = async ({ request, params }) => {
    const formData = await request.formData();
    const auth = await getUserSession(request);
    if (!auth.data) {
      return redirect("/login");
    }

    if (request.method === "PUT") {

    // const formData = await request.formData();
    const title = formData.get("title");
    const release_date = formData.get("release_date");
    const description = formData.get("description");
    const isbn = formData.get("isbn");
    const format = formData.get("format");
    const number_of_pages = formData.get("number_of_pages");
  
    if (
      typeof title!== "string" ||
      typeof release_date!== "string" ||
      typeof description!== "string" ||
      typeof isbn!== "string" ||
      typeof format!== "string" ||
      typeof number_of_pages!== "string"
    ) {
      return json({ error: "Invalid book data" }, { status: 400 });
    }
    try {
        const response = await updateBook(
            auth.data.userToken,
            Number(params.bookId),
            {
            "title": title,
            "release_date": new Date(release_date).toISOString(),
            "description": description,
            "isbn": isbn,
            "format":format,
            "number_of_pages": parseInt(number_of_pages),
            },
        )

      return redirect(`/books/${params.bookId}`);
    } catch (error) {
      console.error("Error updating book:", error);
      return json({ error: "Failed to update book" }, { status: 500 });
    }
}else if (request.method == 'POST'){
  if (params.bookId) {
    await deleteBook(auth.data.userToken, Number(params.bookId));
    return redirect("/books");
  }
}
return {}
  };
  
  export default function BookDetails() {
    const { book } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const [editedBook, setEditedBook] = useState<Book>(book);
    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = useCallback((field: keyof Book, value: string) => {
      setEditedBook((prevBook) => ({...prevBook, [field]: value }));
    },[]);
  
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
            <Form method="put" onSubmit={() => {setSuccessMessage("Book saved successfully!")}}>
                <FormLayout>
                  <TextField
                    label="Title"
                    value={editedBook.title}
                    name="title"
                    onChange={(value) => handleInputChange("title", value)}
                    autoComplete="title"
                  />
                  <TextField
                    label="Release Date"
                    type="date"
                    name="release_date"
                    value={editedBook.release_date.slice(0, 10)}
                    onChange={(value) => handleInputChange("release_date", value)}
                    autoComplete="release_date"
                  />
                  <TextField
                    label="Description"
                    value={editedBook.description}
                    name="description"
                    onChange={(value) =>
                      handleInputChange("description", value)
                    }
                    multiline
                    autoComplete="description"
                  />
                  <TextField
                    label="ISBN"
                    value={editedBook.isbn}
                    name="isbn"
                    onChange={(value) => handleInputChange("isbn", value)}
                    autoComplete="isbn"
                  />
                  <TextField
                    label="Format"
                    value={editedBook.format}
                    name="format"
                    onChange={(value) => handleInputChange("format", value)}
                    autoComplete="format"
                  />
                  <TextField
                    label="Number of Pages"
                    type="number"
                    name="number_of_pages"
                    value={editedBook.number_of_pages.toString()}
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
            <Card>
              <Form method="post">
                <input type="hidden" name="authorId" value={book.id} />
                <Button tone="critical" submit>
                  Delete Book
                </Button>
              </Form>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }