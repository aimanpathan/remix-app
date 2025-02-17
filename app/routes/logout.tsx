import { redirect } from "@remix-run/react";
import { LoaderFunction, ActionFunction } from "@remix-run/node"
import { logout } from './utils/auth.server'

export const action: ActionFunction = async ({request}) => {
    return logout(request)
}

export const loader: LoaderFunction = async ({ request }) => {
    return redirect('/login');
}