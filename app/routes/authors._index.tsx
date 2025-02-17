import {
    Card,
    DataTable,
    Button
  } from "@shopify/polaris";
  import { redirect, useLoaderData,Link } from "@remix-run/react";
  import { json, LoaderFunction } from "@remix-run/node";
  import { getUserSession, fetchAuthors } from "~/routes/utils/auth.server";
  
  type Author = {
    id: number;
    first_name: string;
    last_name: string;
    books_count?: number;
  };
  
  export const loader: LoaderFunction = async ({ request }) => {
    const auth = await getUserSession(request);
    if (!auth.data) {
      return redirect("/");
    }
  
    const authorsResponse = await fetchAuthors(auth.data.userToken);
    const authors: Author[] = authorsResponse || [];
  
    return json({ authors });
  };
  
  export default function Authors() {
    const { authors } = useLoaderData<typeof loader>();
  
    const rows = authors.map((author: Author) => [
      author.id,
      `${author.first_name} ${author.last_name}`, // Combine first and last name
      author.books_count?? "N/A",

      <Button url={`/authors/${author.id}`}>View</Button>
      ,
    ]);
  
    return (
      <Card>
        <DataTable
          columnContentTypes={["numeric", "text", "numeric", "text"]}
          headings={["Author ID", "Author Name", "Books Count", "Actions"]} // Corrected heading name
          rows={rows}
        />
      </Card>
    );
  }
  