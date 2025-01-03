// This file holds various components that are used in several places throughout the site

import React, { useEffect, useState } from 'react';
import { useAppState } from './fakestackoverflow';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export function Menu() {
    const navigate = useNavigate();
    const { user, setUser, setSearchTerm} = useAppState();

    const logout = async (e) => {
        setUser(false);
        console.log((await axios.get('http://localhost:8000/logout', {withCredentials : true})).data);
    };

    return (
        <div className="menu">
        <div className="logo">Fake Stack Overflow</div>
        <div className="menu-items">
            <div>
                <Link to="/homepage" className="menu-button" onClick={() => setSearchTerm(false)}>Questions</Link>
            </div>
            <div>
                <Link to="/tags" className="menu-button">Tags</Link>
            </div>
            <div className="search-bar">
                <input type="text" placeholder="Search..." onKeyDown={(event) => {if (event.key === 'Enter') {
                    setSearchTerm(event.target.value.toLowerCase());
                    navigate('/homepage/search');
                }}}/>
            </div>
            {user ? ( // Render profile and logout buttons if logged in
            <>
                <Link to={user.isAdmin ? "/adminProfile" : "/profile/" + user._id} className="menu-button">Profile</Link>
                <Link to="/" className="menu-button"  onClick={logout}>Logout</Link>
            </>
            ) : ( // Render login button if not logged in
                <Link to="/login" className="menu-button">Login</Link>
            )}
        </div>
        </div>
    );
};

export function AskQuestionButton() {
  const { user } = useAppState();
  if (user) return <Link to="/newQuestion" className="askquestionbutton">Ask Question</Link>;
}

export function PrevNextButtons({pageNumber, setPageNumber, numPages}) {
    if (numPages < 2) return;
    const nextPage = () => { setPageNumber((pageNumber + 1) % numPages); };
    const prevPage = () => { setPageNumber(pageNumber - 1); };

    return (
        <div className='prevnextbuttons'>
            {pageNumber>0 ? <button onClick={prevPage}>prev</button> : <button disabled>prev</button>} 
            <span>&nbsp;Page {pageNumber+1}&nbsp;</span> 
            <button onClick={nextPage}>next</button>
        </div>
    );
}

export function Vote({parent, type}) {
    const { user, refreshSession } = useAppState();
    const [voteCount, setVoteCount] = useState(parent.votes);
    let prevVoteState = 0;
    if (user) {
        const userVotes = type==='comment' ? user.votedComments : (type==='answer' ? user.votedAnswers : user.votedQuestions);
        if (type==='comment') {
            userVotes.forEach(c => { if (c === parent._id) prevVoteState = 1; });
        } else if (type==='answer') {
            userVotes.forEach(av => { if (av.answer === parent._id) prevVoteState = (av.upvote ? 1 : -1); });
        } else if (type==='question') {
            userVotes.forEach(qv => { if (qv.question === parent._id) prevVoteState = (qv.upvote ? 1 : -1); });
        }
    }
    
    const [voted, setVoted] = useState(prevVoteState); // 0: no vote, 1: upvoted, -1: downvoted

    useEffect(() => {refreshSession()}, [voted]);

    if (!user) // guests cannot vote
        return <div className="voting-mechanism"><div className="vote-count">{voteCount} votes</div></div>;

    const handleUpVote = () => {
        if (user.reputation < 50) { alert("User must have more than 50 reputation to vote."); return; }
        if (voted === 1) {
            axios.post('http://localhost:8000/vote', {type:type, id:parent._id, vote:-1, upvote:true, repUser:parent.by}, {withCredentials : true});
            setVoteCount(voteCount - 1);
            setVoted(0);
        } else if (voted === -1) {
            axios.post('http://localhost:8000/vote', {type:type, id:parent._id, vote:2, upvote:true, repUser:parent.by}, {withCredentials : true});
            setVoteCount(voteCount + 2);
            setVoted(1);
        } else {
            axios.post('http://localhost:8000/vote', {type:type, id:parent._id, vote:1, upvote:true, repUser:parent.by}, {withCredentials : true});
            setVoteCount(voteCount + 1);
            setVoted(1);
        }
    };

    const handleDownVote = () => {
        if (user.reputation < 50) { alert("User must have more than 50 reputation to vote."); return; }
        if (voted === -1) {
            axios.post('http://localhost:8000/vote', {type:type, id:parent._id, vote:1, upvote:false, repUser:parent.by}, {withCredentials : true});
            setVoteCount(voteCount + 1);
            setVoted(0);
        } else if (voted === 1) {
            axios.post('http://localhost:8000/vote', {type:type, id:parent._id, vote:-2, upvote:false, repUser:parent.by}, {withCredentials : true});
            setVoteCount(voteCount - 2);
            setVoted(-1);
        } else {
            axios.post('http://localhost:8000/vote', {type:type, id:parent._id, vote:-1, upvote:false, repUser:parent.by}, {withCredentials : true});
            setVoteCount(voteCount - 1);
            setVoted(-1);
        }
    };
    
    return (
        <div className="voting-mechanism">
            <div className={`vote-arrow up ${voted === 1 ? 'voted' : ''}`} onClick={handleUpVote}>
                <span>△</span>
            </div>
            <div className="vote-count">{voteCount}</div>
            {type !== 'comment' ? (
                <div className={`vote-arrow down ${voted === -1 ? 'voted' : ''}`} onClick={handleDownVote}>
                    <span>▽</span>
                </div>) : null
            }
        </div>
    );
}

// Returns correctly formatted date string based on how long ago date is
export function getDateString(date) {
    if (typeof(date) === 'string') { date = new Date(date); }
    const elapsed = Math.floor((Date.now() - date) / 1000);
    if (elapsed < 60) return elapsed + " seconds ago";
    if (elapsed/60 < 60) return Math.floor(elapsed/60) + " minutes ago";
    if (elapsed/(60 * 60) < 24) return Math.floor(elapsed/(60 * 60)) + " hours ago";
    const months = ['Jan', 'Feb', 'Mar', 'April', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (new Date().getFullYear() === date.getFullYear()) return months[date.getMonth()] + " " + date.getDate() + " at " + date.toTimeString().slice(0,5);
    return months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear() + " at " + date.toTimeString().slice(0,5);
  }

  // Returns length of time since date
export function getTimeDifference(date) {
    if (typeof(date) === 'string') { date = new Date(date); }
    const currentDate = new Date();
    const timeDifference = currentDate - date;
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const millisecondsPerMonth = millisecondsPerDay * 30;
    const millisecondsPerYear = millisecondsPerDay * 365;

    const years = Math.floor(timeDifference / millisecondsPerYear);
    const months = Math.floor((timeDifference % millisecondsPerYear) / millisecondsPerMonth);
    const days = Math.floor((timeDifference % millisecondsPerMonth) / millisecondsPerDay);

    let result = '';

    if (years > 0) {result += `${years} ${years === 1 ? 'year' : 'years'}`;}

    if (months > 0) {
        if (result) {result += ', ';}
        result += `${months} ${months === 1 ? 'month' : 'months'}`;
    }

    if (days > 0) {
        if (result) { result += ', '; }
        result += `${days} ${days === 1 ? 'day' : 'days'}`;
    }

    if (result === '') {
        return "less than 1 day"
    }

    return result;
}