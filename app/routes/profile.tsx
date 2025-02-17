import {
    Card,
    TextField,
    Button,
    FormLayout,
    Page,
    Layout,
    Text,
    Checkbox
  } from "@shopify/polaris";
  import { useState, useCallback, useEffect } from "react";
  import { redirect, useLoaderData, useNavigate, Form } from "@remix-run/react";
  import { json, LoaderFunction, ActionFunction } from "@remix-run/node";
  import { getUser, getUserSession, updateUser } from "~/routes/utils/auth.server";
  
  type User = {
    id: number;
    email: string,
    first_name: string,
    last_name: string,
    gender: string;
  };
  
  export const loader: LoaderFunction = async ({ params, request }) => {
    const auth = await getUserSession(request);
    if (!auth.data) {
      return redirect("/login");
    }
  
    if (!auth.data.userId) {
      throw new Error("User ID is required");
    }

    const userId = auth.data.userId;
    const user = await getUser(auth.data.userToken,Number(userId));
    return json({ user });
  };
  
  export const action: ActionFunction = async ({ request, params }) => {
    const userSessionData = await getUserSession(request);
    if (!userSessionData.data.userId) {
      return redirect("/login");
    }
    const userId = userSessionData.data.userId;
    const formData = await request.formData();
    const auth = await getUserSession(request);
    if (!auth.data) {
      return redirect("/login");
    }

    console.log(request.method,auth.data)

    if (request.method === "PUT") {
    const email = formData.get("email");
    const first_name = formData.get("first_name");
    const last_name = formData.get("last_name");
    const gender = formData.get("gender");

    if (
      typeof email!== "string" ||
      typeof first_name!== "string" ||
      typeof last_name!== "string" ||
      typeof gender!== "string"
    ) {
      return json({ error: "Invalid user data" }, { status: 400 });
    }
    try {
        const response = await updateUser(
            auth.data.userToken,
            Number(userId),
            {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "gender":gender,
            },
        )

        console.log(response)
        

      return redirect(`/profile`);
    } catch (error) {
      console.error("Error updating user:", error);
      return json({ error: "Failed to update user" }, { status: 500 });
    }
}
return {}
};


  
  export default function UserDetails() {
    const { user } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const [editedUser, setEditedUser] = useState<User>(user);
    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = useCallback((field: keyof User, value: string) => {
            setEditedUser((prevUser) => ({...prevUser, [field]: value }));
    },[]);

    return (
      <Page
        fullWidth
        title="User Details"
        primaryAction={{
          content: "Back",
          onAction: () => navigate(`/`),
        }}
      >
        <Layout>
          <Layout.Section>
            <Card>
            <Form method="put" onSubmit={() => {setSuccessMessage("Book saved successfully!")}}>
                <FormLayout>
                  <TextField
                    label="Email"
                    value={editedUser.email}
                    name="email"
                    onChange={(value) => handleInputChange("email", value)}
                    autoComplete="email"
                    readOnly
                  />
                  <TextField
                    label="First Name"
                    name="first_name"
                    value={editedUser.first_name}
                    onChange={(value) => handleInputChange("first_name", value)}
                    autoComplete="first_name"
                  />
                  <TextField
                    label="Last Name"
                    name="last_name"
                    value={editedUser.last_name}
                    onChange={(value) => handleInputChange("last_name", value)}
                    autoComplete="last_name"
                  />
                  <TextField
                    label="Gender"
                    value={editedUser.gender}
                    name="gender"
                    onChange={(value) => handleInputChange("gender", value)}
                    autoComplete="gender"
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