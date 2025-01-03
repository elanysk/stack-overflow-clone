import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { Menu, AskQuestionButton, PrevNextButtons, getDateString, Vote } from './common';
import { useAppState } from './fakestackoverflow';
import axios from 'axios';

let triggerRefresh = false;

export default function AnswersPage({edit}) {
    const location = useLocation();
    const { user, refreshSession } = useAppState();
    const [pageContent, setPageContent] = useState("");
    let { id, userid } = useParams();

    const newAnswerLink = '/newAnswer/' + id;
    // const edit = location.pathname.split('/').slice(-1) === 'edit';

    useEffect(() => {
        const fetchData = async () => {
            let user_ = await refreshSession();
            if (user_.isAdmin) {
                console.log(userid);
                user_ = (await axios.get('http://localhost:8000/user/'+userid)).data;
            }
            const question = (await axios.get('http://localhost:8000/question/' + id)).data;
            let answers = (await axios.get('http://localhost:8000/answers/' + id)).data;

            if (edit) {
                answers.sort((a1, a2) => {
                    if (a1.by._id === a2.by._id) { return (new Date(a2.datetime)) - (new Date(a1.datetime)); } 
                    else if (a1.by._id === user_._id) { return -1; }
                    else if (a2.by._id === user_._id) { return 1; }
                    else { return (new Date(a2.datetime)) - (new Date(a1.datetime)); }
                });
            }

            const numAnswersText = answers.length!== 1?answers.length+" answers":"1 answer";
            const viewCount = question.views!== 1 ? question.views+" views" : "1 view";

            const p = (
                <>
                <div className="pageheader">
                    <h2 id="homepagetitle">{question.title}</h2>
                    <AskQuestionButton />
                </div>
                <div className="subheader">
                    <p style={{'display': 'inline-block', 'fontWeight': 600}}>{viewCount}</p>
                    <div className="taglist"> {question.tags.map(t => <span key={t._id} className="questiontag">{t.name}</span>)} </div>
                    <span style={{"color":"rgb(168, 14, 14)", "fontWeight": 500}}>{question.by.username}&nbsp;</span>
                    <span style={{"color":"rgb(128, 128, 128)", "fontSize": 12}}> asked {getDateString(question.datetime)}</span>
                </div>
                
                <hr />

                <div style={{"display": "flex"}}>
                    <Vote parent={question} type={'question'}/>
                    <p style={{"marginLeft": "30px", "marginRight": "40px"}} dangerouslySetInnerHTML={{__html: parseHyperlinks(question.text)}}/>
                </div>

                <Comments comments={question.comments.sort((c1, c2) => new Date(c2.datetime) - new Date(c1.datetime))} type={'Question'} on={id} />

                <hr />
                <h3>{numAnswersText}</h3>
                <hr />

                <Answers answers={answers} edit={edit} />

                {user_ ? <Link to={newAnswerLink} className="askquestionbutton">Answer Question</Link> : null}
                </>
            );
            setPageContent(p);
        };

        fetchData();
    }, [triggerRefresh]);

    if (pageContent === "") return null;
    return (
        <>
          <Menu />
          {pageContent}
        </>
    );
}

function Answers(props) {
    const [pageNumber, setPageNumber] = useState(0);
    const [answers, setAnswers] = useState('');

    useEffect(() => setPageNumber(0), [props.sortOrder]);

    useEffect(() => {
        setAnswers(props.answers.slice(pageNumber*5, pageNumber*5+5));
    }, [pageNumber, props.answers]);

    if (answers === '') return null;
    return (
        <>
        <div className="questioncontent">
        <div className="questionsdiv">
            {answers.map(a => <Answer key={a._id} a={a} edit={props.edit} answers={answers} setAnswers={setAnswers}/>)}
        </div>
        </div>
        <PrevNextButtons pageNumber={pageNumber} setPageNumber={setPageNumber} numPages={Math.ceil(props.answers.length/5)}/>
        </>
    );
}

const Answer = ({a, edit, answers, setAnswers}) => {
    const { user, refreshSession } = useAppState();
    let { userid } = useParams();

    const deleteAnswer = async () => {
        const response = (await axios.post('http://localhost:8000/deleteAnswer', {id:a._id}, {withCredentials : true})).data;
        console.log(response);
        if (!response.success) { alert(response.msg); return; }
        refreshSession();
        triggerRefresh = !triggerRefresh;
    };

    const editAnswer = async () => {
        let newAnswer = prompt("Enter new answer text: ", a.text);
        if (newAnswer === null) return;
        if (newAnswer === "") { alert("Answer cannot be empty."); return; }
        const response = (await axios.post('http://localhost:8000/editItem', {itemType: 'answer', item: {text: newAnswer}, id:a._id}, {withCredentials : true})).data;
        console.log(response);
        refreshSession();
        triggerRefresh = !triggerRefresh;
    }

    const editDeleteButtons = (
    <>
        <button type="button" onClick={editAnswer}>Edit Answer</button>
        <button type="button" onClick={deleteAnswer}>DELETE Answer</button>
    </>
    )

    return (
    <>
        <div className="answer">
            <Vote parent={a} type={'answer'}/>
        <div style={{"marginLeft": "5px", "marginRight": "40px"}}>
            <p dangerouslySetInnerHTML={{__html: parseHyperlinks(a.text)}}/>
        </div>

        <div id="answermetadata" style={{"minWidth": "200px"}}>
            <div>
            <p style={{"color":"rgb(85, 130, 59)", "fontWeight": 500, "margin":0}}>{a.by.username}</p>
            <p style={{"color":"rgb(128, 128, 128)", "fontSize": 12, "margin":0}}>answered {getDateString(a.datetime)}</p>
            </div>
        </div>

        {edit && userid === a.by._id ? editDeleteButtons : null}

        </div>
        <Comments comments={a.comments.sort((c1, c2) => new Date(c2.datetime) - new Date(c1.datetime))} type={'Answer'} on={a._id}/>
        <hr/>
    </>
    )
    
};

function Comments(props) {
    const { user } = useAppState();
    const [pageNumber, setPageNumber] = useState(0);
    const [comments, setComments] = useState('');

    useEffect(() => setPageNumber(0), [props.sortOrder]);

    useEffect(() => {
        setComments(props.comments.slice(pageNumber*3, pageNumber*3+3));
    }, [pageNumber, props.comments]);

    if (comments === '') return null;

    const numCommentsText = props.comments.length!== 1?props.comments.length+" comments":"1 comment";

    
    return (
        <>
        <div className="commentsdiv">
            <p>{numCommentsText}</p>
            <div style={{"marginLeft": "40px"}}>
                {comments.map(c => (
                    <div key={c._id} style={{"display": "flex"}}>
                        <Vote parent={c} type={'comment'}/>
                        <p style={{"marginLeft": "40px"}} dangerouslySetInnerHTML={{__html: parseHyperlinks(c.text)}}/>
                        <p style={{"marginLeft": "40px", "color":"rgb(128, 128, 128)", "fontSize": 12}}>{c.by.username} commented {getDateString(c.datetime)}</p>
                    </div>
                ))}
                { user ? 
                <input type="text" placeholder="Add a comment..." style={{"width":"50%"}}
                onKeyDown={(event) => {if (event.key === 'Enter') {
                    createComment({text: event.target.value, by: user._id, on: props.on, commentType:props.type}, comments, setComments, setPageNumber, user.reputation);
                    event.target.value = "";
                }}}/> : null}
                
            </div>
        </div>
        <PrevNextButtons pageNumber={pageNumber} setPageNumber={setPageNumber} numPages={Math.ceil(props.comments.length/3)}/>
        </>
    );
};

async function createComment(comment, comments, setComments, setPageNumber, reputation) {
    if (reputation < 50) { alert("User must have more than 50 reputation to add a new comment."); return; }
    if (comment.text.length > 140) { alert("Comment cannot be more than 140 characters."); return; }
    const response = (await axios.post('http://localhost:8000/createNewItem', {itemType: 'comment', item: comment}, {withCredentials : true})).data;
    console.log(response);
    let newComments = [...comments];
    newComments.push(response.item);
    setComments(newComments);
    setPageNumber(0);
    triggerRefresh = !triggerRefresh;
}

export function NewAnswer() {
    const navigate = useNavigate();
    let { id } = useParams();
    const {user} = useAppState();
    const [formData, setFormData] = useState({
        text: '',
    });

    useEffect(() => {
        if (!user) { navigate('/answers/' + id); }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { return; }
        if (formData.text === "") { alert("Answer cannot be empty."); return; }

        let answer = {
            text: formData.text,
            by: user._id,
            question: id,
        }
        console.log(answer);
        const response = (await axios.post('http://localhost:8000/createNewItem', {itemType: 'answer', 'item': answer}, {withCredentials : true})).data;
        console.log(response);
        if (!response.success) { alert("Failed to create new answer: " + response.msg); return; }

        navigate('/question/' + id);
    };

    return (
        <>
        <Menu />
        <div className="register-container">
        <h2>Answer Question</h2>
        <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
            <label htmlFor="text">Answer Text:</label> <br/>
            <textarea id="text" name="text" value={formData.text} onChange={handleChange}/>
            </div>
            <button type="submit" className="signup-button">Create Answer</button>
        </form>
        </div>
        </>
    );
}

function parseHyperlinks(text) {
    const regex = /(.*?)\[([^[]+)]\(([^(]+)\)(.*?)/g;
    const replacePattern = '$1<a href="$3" target="_blank">$2</a>$4';
    return text.replace(regex, replacePattern);
}