import { json, LoaderFunction, ActionFunction, redirect } from "@remix-run/node";
import { useLoaderData, Form, Link } from "@remix-run/react";
import { getSingleAuthor, deleteAuthor, getUserSession, deleteBook } from "~/routes/utils/auth.server";
import { Card, Button, Text, Badge, ResourceList, ResourceItem,InlineGrid,InlineStack } from "@shopify/polaris";

export const loader: LoaderFunction = async ({ params, request }) => {    
  const auth = await getUserSession(request);
  if (!auth) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const authorId = params.authorId;
  if (!authorId) {
    throw new Response("Author ID is required", { status: 400 });
  }

  try {
    const author = await getSingleAuthor(auth.data.userToken, Number(authorId));
    return json({ author });
  } catch (error) {
    throw new Response("Failed to fetch author", { status: 500 });
  }
};
export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const authorId = formData.get("authorId");
    const bookId = formData.get("bookId");
    if (!authorId && !bookId) {
        return json({ success: false, message: "Resource ID is required" }, { status: 400 });
    }
  
    const auth = await getUserSession(request);
    if (!auth) {
      throw new Response("Unauthorized", { status: 401 });
    }
  
    try {
        if (bookId) {
            await deleteBook(auth.data.userToken, Number(bookId));
            return json({ success: true, message: "Book deleted successfully" });
        } else if (authorId) {
            // Get the author's details first
            const author = await getSingleAuthor(auth.data.userToken, Number(authorId));
        
            // Prevent deletion if the author has books
            if (author.books_count > 0) {
              throw new Response("Cannot delete an author with associated books", { status: 403 });
            }
        
            await deleteAuthor(auth.data.userToken, Number(authorId));
            return redirect("/authors");
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to process request";
        throw new Response(errorMessage, { status: 500 }); }

  };

export default function AuthorDetailPage() {
  const { author } = useLoaderData<typeof loader>();

  return (
    <Card>
      {/* Back Button */}
      <Button url="/authors">
        Back to Authors
      </Button>
      
      {/* Author Details */}
      <Card>
        <Text variant="headingXl" as="h2">AUTHOR DETAILS</Text>
        <Text variant="headingMd" as="h1">
          {author.first_name} {author.last_name}
        </Text>
        <Text as="p">
          <strong>Born:</strong> {new Date(author.birthday).toLocaleDateString()}
        </Text>
        <Text as="p">
          <strong>Place of Birth:</strong> {author.place_of_birth}
        </Text>
        <Text as="p">
          <strong>Biography:</strong> {author.biography}
        </Text>
      </Card>
      
      {/* Books List */}
      <Card>
        <Text variant="headingXl" as="h2">AUTHOR BOOKS</Text>
        {author.books.length > 0 ? (
          <ResourceList
            resourceName={{ singular: "book", plural: "books" }}
            items={author.books}
            renderItem={(book) => (
            <ResourceItem 
            id={book.id} 
            accessibilityLabel={`View details for ${book.title}`} 
            onClick={() => redirect(`/books/${book.id}`)}>
                <InlineGrid gap="400" columns={2}>
                    <InlineStack gap="200" wrap={false}>
                        <Text variant="bodyMd" fontWeight="bold" as="p">{book.title}</Text>
                        <Text as="p">{new Date(book.release_date).toLocaleDateString()}</Text>
                    </InlineStack>

                    {/* Delete Button */}
                    <Form method="post">
                        <input type="hidden" name="bookId" value={book.id} />
                        <Button tone="critical" submit>
                            Delete Book
                        </Button>
                    </Form>
                </InlineGrid>
              </ResourceItem>
            )}
          />
        ) : (
          <Text as="p">No books available</Text>
        )}
      </Card>
      
      {/* Delete Author Button */}
      {author.books.length === 0 && (
        <Card>
          <Form method="post">
            <input type="hidden" name="authorId" value={author.id} />
            <Button tone="critical" submit>
              Delete Author
            </Button>
          </Form>
        </Card>
      )}
    </Card>
  );
}
