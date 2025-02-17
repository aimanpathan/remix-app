import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  LiveReload,
  Link,
  useLoaderData
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { getUserSession } from "~/routes/utils/auth.server";
import { LoaderFunction,json } from '@remix-run/node'


import "./tailwind.css";
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';
import "~/styles/global.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];


export const loader: LoaderFunction = async ({ request }) => {
  const session = await getUserSession(request);
  return json({ userName: session?.data?.userName || null });
}

export function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        {process.env.NODE_ENV === 'development' ? <LiveReload /> : null}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Layout({ children }:  { children: React.ReactNode }) {
  const loaderData = useLoaderData<typeof loader>() || {};
  const userName = loaderData.userName || null; 

  return (
    <>
      <nav className="bg-gray-800 mb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="text-xl font-semibold tracking-tight text-white">
                Remix
              </div>
              <div className="">
                <div className="ml-10 flex items-baseline space-x-4">
                  <a href="/" className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Dashboard</a>
                  { userName ? (
                    <div className="flex items-center">
                    <Link to='/authors' className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Authors</Link>
                    <Link to='/books' className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Books</Link>
                    <Link to='/profile' className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Profile</Link>

                    <span className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                      <form action='/logout' method='POST'>
                        <button type='submit' className='btn'>
                          Logout {userName}
                        </button>
                      </form>
                    </span>
                    </div>
                    )
                  : (
                    <Link to='/login' className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Login</Link>
                  ) }
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className='container my-30'>{children}</div>
    </>
  )
}

// export function ErrorBoundary({ error }: { error: React.ReactNode }) {
//   console.log(error);

//   const errorMessage =
//     error instanceof Error ? error.message : "An unknown error occurred";

//   return (
//     <Document>
//       <Layout>
//         <h1>Error</h1>
//         <p>{errorMessage}</p>
//       </Layout>
//     </Document>
//   );
// }


export default function App() {
  return (
      <Document>
        <Layout>
          <AppProvider i18n={enTranslations}>
            <Outlet />
          </AppProvider>
        </Layout>
      </Document>
    );
}
