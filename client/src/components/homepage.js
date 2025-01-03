import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, AskQuestionButton, PrevNextButtons, getDateString, Vote } from './common';
import { useAppState } from './fakestackoverflow';
import axios from 'axios';

export default function Homepage({profile}) {
    const location = useLocation();
    const { searchTerm } = useAppState();
    const [pageContent, setPageContent] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");

    useEffect(() => {
        const fetchData = async () => {
            let questions;
            let headerText;
            let numQuestionsText;
            const routepath = location.pathname.split('/');
            const doSearch = (routepath.length === 3);
            if (profile) { // displayed on profile page
                console.log("Loading homepage with on profile " + profile.username);
                questions = (await axios.get('http://localhost:8000/questions/' + sortOrder)).data;
                questions = questions.filter(q => (q.answers.map(a => String(a.by)).includes(profile._id)))
                headerText = "Answered Questions";
                numQuestionsText = questions.length + " Questions";
            } else if (!doSearch) { // No search
                console.log("Loading homepage with " + sortOrder + " questions.");
                questions = (await axios.get('http://localhost:8000/questions/' + sortOrder)).data;
                headerText = "All Questions";
                numQuestionsText = questions.length + " Questions";
            } else { // Yes search
                console.log("Loading homepage with search: " + searchTerm);
                questions = (await axios.get('http://localhost:8000/questions/' + sortOrder)).data;
                headerText = "Search Results";

                let words = searchTerm.split(" ");
                let tags = words.filter(w => (w[0] === "[" && w.slice(-1) === "]")).map(t => t.slice(1,-1));
                words = words.filter(w => !tags.includes(w) && w.length != 0);
                questions = questions.filter(q => (
                    q.tags.some(t => tags.includes(t.name)) ||
                    words.some(w => (q.title.toLowerCase().includes(w) || q.text.toLowerCase().includes(w)))
                ));

                numQuestionsText = questions.length + " Questions";
            }

            const p = (
                <>
                <div id="homepageheader" className="pageheader">
                    <h2 id="homepagetitle">{headerText}</h2>
                    <AskQuestionButton />
                </div>
                <div className="subheader">
                    <p id="questioncount" style={{'display': 'inline-block', 'fontWeight': 600}}>{numQuestionsText}</p>
                    <div id="sortbuttonsdiv">
                        <button className="sortbutton" id="newest" onClick={() => setSortOrder("newest")}>Newest</button>
                        <button className="sortbutton" id="active" style={{'borderLeft': 'none', 'borderRight': 'none'}} onClick={() => setSortOrder("active")}>Active</button>
                        <button className="sortbutton" id="unanswered" onClick={() => setSortOrder("unanswered")}>Unanswered</button>
                    </div>
                </div>
                
                <hr />
                {(doSearch && questions.length === 0) ? <p>No results found.</p> : <Questions questions={questions} sortOrder={sortOrder} profile={profile} />}
                </>
            );
            setPageContent(p);
        };

        fetchData();
    }, [sortOrder, searchTerm]);

    if (pageContent === "") return null;
    return (
        <>
          {profile ? null : <Menu />}
          <div id="answerspage"> {pageContent} </div>
        </>
    );
}

export function NewQuestion() {
    const navigate = useNavigate();
    const { user } = useAppState();
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        text: '',
        tags: '',
    });

    useEffect(() => {
        if (!user) { navigate('/homepage'); }
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
            by: user._id
        }
        const response = (await axios.post('http://localhost:8000/createNewItem', {itemType: 'question', 'item': question}, {withCredentials : true})).data;
        console.log(response);
        if (!response.success) { alert("Failed to create new question: " + response.msg); return; }

        navigate('/homepage');
    };

    return (
        <>
        <Menu />
        <div className="register-container">
        <h2>Ask a New Question</h2>
        <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
            <label htmlFor="title">Question Title:</label><br/>
            <textarea id="title" name="title" value={formData.title} onChange={handleChange} />
            </div>
            <div className="form-group">
            <label htmlFor="summary">Question Summary:</label><br/>
            <textarea id="summary" name="summary" value={formData.summary} onChange={handleChange} />
            </div>
            <div className="form-group">
            <label htmlFor="text">Question Text:</label><br/>
            <textarea id="text" name="text" value={formData.text} onChange={handleChange} />
            </div>
            <div className="form-group">
            <label htmlFor="tags">Tags:</label>
            <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} />
            </div>
            <button type="submit" className="signup-button">Create Question</button>
        </form>
        </div>
        </>
    );
}

function Questions(props) {
    const [pageNumber, setPageNumber] = useState(0);
    const [questions, setQuestions] = useState('');

    useEffect(() => setPageNumber(0), [props.sortOrder]);

    useEffect(() => {
        setQuestions(props.questions.slice(pageNumber*5, pageNumber*5+5));
    }, [pageNumber, props.questions]);

    if (questions === '') return null;
    return (
        <>
        <div className="questioncontent">
        <div className="questionsdiv">
            {questions.map(q => <Question key={q._id} q={q} profile={props.profile}/>)}
        </div>
        </div>
        <PrevNextButtons pageNumber={pageNumber} setPageNumber={setPageNumber} numPages={Math.ceil(props.questions.length/5)}/>
        </>
    );

}

function Question({q, profile}) {
    const navigate = useNavigate();
    const clickOnQuestion = async () => {
        const response = (await axios.post('http://localhost:8000/incrementViews', {id: q._id}, {withCredentials : true})).data;
        if (profile) navigate('/question/' + q._id + '/' + profile._id);
        else navigate('/question/' + q._id);
    };
  
    const answerCount = q.answers.length!== 1 ? q.answers.length+" answers" : "1 answer";
    const viewCount = q.views!== 1 ? q.views+" views" : "1 view";

    return (
        <>
        <div className="question">
            <div>
                <p style={{"whiteSpace": "pre-wrap", "color": "rgb(128,128,128)"}}>{answerCount + "\n" + viewCount}</p>
                <div className="voting-mechanism"><div className="vote-count">{q.votes} votes</div></div>
            </div>
        
            

            <div style={{"marginLeft": "30px", "marginRight": "30px"}}>
                <p id={q._id} className="questionlink" onClick={clickOnQuestion}>{q.title}</p>
                <p>{q.summary}</p>
                <div className="taglist"> {q.tags.map(t => <span key={t._id} className="questiontag">{t.name}</span>)} </div>
            </div>
        
            <div className="questionmetadata">
                <div style={{"color":"rgb(168, 14, 14)", "fontWeight": 500}}>{q.by.username}&nbsp;</div><br/>
                <div style={{"color":"rgb(128, 128, 128)", "fontSize": 12}}> asked {getDateString(q.datetime)}</div>
            </div>
        </div>
        <hr/>
        </>
    )
  };