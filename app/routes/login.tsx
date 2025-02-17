import { ActionFunction, json,LoaderFunction } from "@remix-run/node";
import { useActionData,redirect } from "@remix-run/react";
import { authenticateUser,createUserSession,getUserSession } from "./utils/auth.server";
import { Card,BlockStack,Text } from "@shopify/polaris"

function validateEmail(email: string) {
    if (!email.includes("@")) return "Invalid email format";
    return null;
}
  
  function validatePassword(password: string) {
    if (typeof password !== 'string' || password.length < 6) {
      return 'Password must be at least 6 characters'
    }
  }
  
  function badRequest(data: {}) {
    return json(data, { status: 400 })
  }
  export const loader: LoaderFunction = async ({ request }) => {
    const session = await getUserSession(request);
    const token = session.data.userToken;
  
    if (token) {
      return redirect("/authors");
    }
  
    return null;
  };  

  export const action: ActionFunction = async ({ request }) => {
    const form = await request.formData()
    const email = form.get('email') as string;
    const password = form.get('password') as string;
  
    const fields = { email, password }
  
    const fieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
  
    if (Object.values(fieldErrors).some(Boolean)) {
      return badRequest({ fieldErrors, fields })
    }
  
    const userData = await authenticateUser(email, password);

    if (!userData.token) {
      return badRequest({
        fields,
        fieldErrors: { email: 'Invalid credentials' },
      })
    }

    return createUserSession(userData.token,userData.id, userData.firstName ,'/authors');
  }


  type ActionData = {
    fields?: { email?: string; password?: string };
    fieldErrors?: { email?: string; password?: string };
  };

function Login() {
    const actionData = useActionData<ActionData>()
  
    return (
      <Card background="bg-surface-secondary">
      <BlockStack gap="200">
        <Text as="h1" variant="headingXl" fontWeight="medium">
          User Login
        </Text>
        <form method='POST'>
          <div className='form-control'>
            <label htmlFor='email'>Email</label>
            <input
              type='text'
              name='email'
              id='email'
              defaultValue={actionData?.fields?.email}
            />
            <div className='error'>
              {actionData?.fieldErrors?.email ? (
                <p
                  className='form-validation-error'
                  role='alert'
                  id='email-error'
                >
                  {actionData.fieldErrors.email}
                </p>
              ) : null}
            </div>
          </div>

          <div className='form-control'>
            <label htmlFor='password'>Password</label>
            <input
              type='password'
              name='password'
              id='password'
              defaultValue={actionData?.fields?.password || ""}
            />
            <div className='error'>
              {actionData?.fieldErrors?.password ? (
                <p
                  className='form-validation-error'
                  role='alert'
                  id='password-error'
                >
                  {actionData.fieldErrors.password}
                </p>
              ) : null}
            </div>
          </div>

          <button className='btn btn-block' type='submit'>
            Submit
          </button>
        </form>
      </BlockStack>
    </Card>
    )
  }
  
  export default Login
