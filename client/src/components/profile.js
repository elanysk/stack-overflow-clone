import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Menu, AskQuestionButton, getTimeDifference } from './common';
import { useAppState } from './fakestackoverflow';
import Homepage from './homepage';
import axios from 'axios';

export default function Profile() {
    let { user, refreshSession } = useAppState();
    let profileUser = user;
    let { id } = useParams();
    const [pageContent, setPageContent] = useState("");
    const [userContent, setUserContent] = useState(<AskedQuestions />);

    const clickAskedQuestions = async () => {
        setUserContent(<AskedQuestions />);
    };
    const clickTagsCreated = async () => {
        setUserContent(<TagsCreated />);
    };
    const clickQuestionsAnswered = async () => {
        setUserContent(<Homepage profile={profileUser}/>);
    };

    useEffect(() => {
        const fetchData = async () => {
            let user_ = await refreshSession();
            if (user_.isAdmin) {
                const actualUser = (await axios.get('http://localhost:8000/user/' + id)).data;
                user_ = actualUser;
                profileUser = actualUser;
            }

            const membershipLength = getTimeDifference(user_.datetime);

            const p = (
                <>
                <div className="pageheader">
                    <h5>You have been a member for {membershipLength}.</h5>
                    <h2>{user_.username}</h2>
                    <h5>You have {user_.isAdmin ? '∞' : user_.reputation} reputation.</h5>
                </div>
                <div>
                    <button className="sortbutton" onClick={clickAskedQuestions}>Asked Questions</button>
                    <button className="sortbutton" style={{'borderLeft': 'none', 'borderRight': 'none'}} onClick={clickTagsCreated}>Tags Created</button>
                    <button className="sortbutton" onClick={clickQuestionsAnswered}>Questions Answered</button>
                </div>
                
                <hr />
                <div>
                    {userContent}
                </div>
                </>
            );
            setPageContent(p);
        };

        fetchData();
    }, [userContent]);

    if (pageContent === "" || profileUser===false) return null;
    return (
        <>
          <Menu />
          {pageContent}
        </>
    );
}

function AskedQuestions() {
    let { refreshSession } = useAppState();
    const [profileUser, setProfileUser] = useState('');
    let { id } = useParams();
    useEffect(() => {
        const fetchData = async () => {
            let user_ = await refreshSession();
            if (user_.isAdmin) {
                const actualUser = (await axios.get('http://localhost:8000/user/' + id)).data;
                user_ = actualUser;
                setProfileUser(actualUser);
            } else {
                setProfileUser(user_);
            }
        };

        fetchData();
    }, []);

    if (profileUser === '') return null;
    return (
        <div>
            <h4>Edit a Question:</h4>
            {profileUser.questions.length>0 ? (profileUser.questions.map( q => (
                <div key={q._id}>
                    <Link to={"/editQuestion/"+profileUser._id+'/'+q._id}>{q.title}</Link>

                </div>
            ))) : "No questions asked."}
        </div>
    );
}

function TagsCreated(props) {
    let { refreshSession, setSearchTerm } = useAppState();
    const [pageContent, setPageContent] = useState("");
    const navigate = useNavigate();
    const [profileUser, setProfileUser] = useState('');
    let { id } = useParams();

    let tags = profileUser.tags;

    useEffect(() => {
        const fetchData = async () => {
            let user_ = await refreshSession();
            if (user_.isAdmin) {
                const actualUser = (await axios.get('http://localhost:8000/user/' + id)).data;
                user_ = actualUser;
                setProfileUser(actualUser);
            } else {
                setProfileUser(user_);
            }

            if (profileUser === '') return null;

            const p = (
            <>
                {tags.length===0 ? "No tags created." : null}
                <div id="tagsdiv">
                    {tags.map(t => 
                        <div className="tag" key={t._id}>
                            <div className="taglink" onClick={() => tagLinkClick(t)}>{t.name}</div>
                            <button type="button" onClick={() => editTag(t)}>Edit Tag</button>
                            <button type="button" onClick={() => deleteTag(t)}>DELETE TAG</button>
                        </div>
                    )}
                </div>
            </>
            );
            setPageContent(p);
        };

        fetchData();
    }, [tags]);

    if (profileUser === '') return null;

    const tagLinkClick = (tag) => {
        setSearchTerm('['+tag.name+']');
        navigate('/homepage/search');
    };

    

    const deleteTag = async (tag) => {
        const response = (await axios.post('http://localhost:8000/deleteTag', {id:tag._id}, {withCredentials : true})).data;
        console.log(response);
        if (!response.success) { alert(response.msg); return; }
        refreshSession();
    };

    const editTag = async (tag) => {
        let newTag = prompt("Enter new tag name: ", tag.name);
        if (newTag === null || newTag === "") return;
        if (newTag.includes(' ')) { alert("Tag cannot have any spaces."); return; }
        if (newTag.length > 20) { alert("Tag cannot be more than 20 characters."); return; }

        const response = (await axios.post('http://localhost:8000/editItem', {itemType: 'tag', item: {name: newTag}, id:tag._id}, {withCredentials : true})).data;
        console.log(response);
        if (!response.success) { alert(response.msg); return; }
        refreshSession();
    }

    if (pageContent === "") return null;
    return (
        <>
          {pageContent}
        </>
    );
}

export function EditQuestion() {
    const navigate = useNavigate();
    const {user} = useAppState();
    const {pid, id} = useParams();
    const [formData, setFormData] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) { navigate('/homepage'); }
            const question = (await axios.get('http://localhost:8000/question/' + id)).data;
            setFormData({
                title: question.title,
                summary: question.summary,
                text: question.text,
                tags: question.tags.map(t => t.name).join(' '),
            });
        };
        
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.title > 50) { alert("The title must be less than 50 characters."); return; }
        if (formData.summary > 140) { alert("The summary must be less than 140 characters."); return; }
        if (formData.title===0 || formData.summary===0 || formData.text===0) { alert("You cannot have an empty title, summary, or text."); return; }
        if (!user) { return; }

        let question = {
            title: formData.title,
            summary: formData.summary,
            text: formData.text,
            tags: Array.from(new Set(formData.tags.split(/\s+/))).map(t => t.toLowerCase()),
        }
        const response = (await axios.post('http://localhost:8000/editItem', {itemType: 'question', item: question, id:id}, {withCredentials : true})).data;
        console.log(response);
        navigate("/profile/"+pid);
    };

    const deleteQuestion = async (e) => {
        const response = (await axios.post('http://localhost:8000/deleteQuestion/', {id: id}, {withCredentials : true})).data;
        console.log(response);
        navigate("/profile/"+pid);
    };

    if (formData === '') return null;

    return (
        <>
        <Menu />
        <div className="register-container">
        <h2>Ask a New Question</h2>
        <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
            <label htmlFor="title">Question Title:</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} />
            </div>
            <div className="form-group">
            <label htmlFor="summary">Question Summary:</label>
            <input type="text" id="summary" name="summary" value={formData.summary} onChange={handleChange} />
            </div>
            <div className="form-group">
            <label htmlFor="text">Question Text:</label>
            <input type="text" id="text" name="text" value={formData.text} onChange={handleChange} />
            </div>
            <div className="form-group">
            <label htmlFor="tags">Tags:</label>
            <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} />
            </div>
            <button type="submit" className="signup-button">Save Question</button><br/>
            <button type="button" className='signup-button' onClick={deleteQuestion}>DELETE QUESTION</button>
        </form>
        </div>
        </>
    );
}

export function AdminProfile() {
    let { user, refreshSession } = useAppState();
    const [pageContent, setPageContent] = useState("");

    const deleteUser = async (u) => {
        const confirmation = window.confirm("Are you sure you want to delete user: " + `${u.username}  |  ${u.email}  |  ${u._id}`)
        if (confirmation) {
            const response = (await axios.post('http://localhost:8000/deleteUser', {id: u._id}, {withCredentials : true})).data;
            console.log(response);
            refreshSession();
            window.location.reload();
        }
        
    };

    useEffect(() => {
        const fetchData = async () => {
            const user_ = await refreshSession();
            const users = (await axios.get('http://localhost:8000/users')).data;

            const membershipLength = getTimeDifference(user_.datetime);

            const p = (
                <>
                <div className="pageheader">
                    <h5>You have been a member for {membershipLength}.</h5>
                    <h2>{user_.username}</h2>
                    <h5>You have {user_.isAdmin ? '∞' : user_.reputation} reputation.</h5>
                </div>
                
                <hr />
                <div>
                    Select a user profile:
                    {users.map(u => (
                        <div key={u._id}>
                            <br/>
                            <Link to={"/profile/"+u._id}>{u.username}  |  {u.email}  |  {u._id}  | == </Link>
                            <button type="button" onClick={() => deleteUser(u)}>DELETE USER</button>
                        </div>
                    ))}
                </div>
                </>
            );
            setPageContent(p);
        };

        fetchData();
    }, []);

    if (pageContent === "" || user===false) return null;
    return (
        <>
          <Menu />
          {pageContent}
        </>
    );
}
