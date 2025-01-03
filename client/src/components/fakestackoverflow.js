import React, {useState, useEffect, createContext, useContext} from "react";
import { createBrowserRouter, RouterProvider, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Welcome, {Register, Login} from "./welcome.js";
import Homepage, {NewQuestion} from "./homepage.js";
import AnswersPage, {NewAnswer} from "./answers.js";
import Tags from "./tags.js";
import Profile, {EditQuestion, AdminProfile} from "./profile.js";

const State = createContext();

export default function FakeStackOverflow() {
    const [user, setUser] = useState(false);
    const [searchTerm, setSearchTerm] = useState(false);

    async function refreshSession() {
        const response = (await axios.get('http://localhost:8000/refreshSession', {withCredentials: true})).data;
        setUser(response);
        return response;
    }

    const router = createBrowserRouter([
        {path: "/", element: <Welcome />},
        {path: "/register", element: <Register />},
        {path: "/login", element: <Login />},
        {path: "/homepage", element: <Homepage/>},
        {path: "/homepage/:searchterm", element: <Homepage/>},
        {path: "/newQuestion", element: <NewQuestion />},
        {path: "/question/:id", element: <AnswersPage edit={false}/>},
        {path: "/question/:id/:userid", element: <AnswersPage edit={true}/>},
        {path: "/newAnswer/:id", element: <NewAnswer />},
        {path: "/tags", element: <Tags />},
        {path: "/profile/:id", element: <Profile />},
        {path: "/adminProfile", element: <AdminProfile />},
        {path: "/editQuestion/:pid/:id", element: <EditQuestion />}
    ])

    useEffect(() => {
        const checkLogIn = async () => {
            const response = (await axios.get('http://localhost:8000/session', {withCredentials: true})).data;
            if (response.user) {
                console.log("User has active session: logging in automatically.")
                setUser(response.user);
                if (['/', '/login', '/register'].includes(window.location.pathname)) {
                    router.navigate('/homepage')
                }
            }
        }
    
        checkLogIn();
      }, []);

    return (
        <State.Provider value={{user, setUser, searchTerm, setSearchTerm, refreshSession}}>
            <RouterProvider router={router} />
        </State.Provider>
    );
}

export const useAppState = () => useContext(State);